import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Joi from "joi";
import { useSelector } from "react-redux";
import { successMsg, errorMsg } from "#helpers";
import { validateFormData } from "#utils/validation";
import { postKycRegister, downloadAgreementPdf, getKycLatest, getCountries, getStates, getCities } from "#services/kycService";
import Storage from "#services/storage";

const toTitleCase = (value) => {
  if (!value || typeof value !== "string") return value;
  return value
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const useKycRegister = () => {
  const { userDetail } = useSelector((state) => state.userDetails);
  const { companyDetails } = useSelector((state) => state.companyDetails);

  const prefillFromProfile = useMemo(() => {
    const name = userDetail?.fullName ?? "";
    const email = userDetail?.emailid ?? "";
    const phone = (userDetail?.mobileNo ?? "").toString().replace(/\s/g, "");
    const address = userDetail?.address ?? companyDetails?.addressStreet ?? "";
    return {
      name: toTitleCase(name),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
    };
  }, [userDetail?.fullName, userDetail?.emailid, userDetail?.mobileNo, userDetail?.address, companyDetails?.addressStreet]);

  const [formData, setFormData] = useState({
    Name: "",
    EmailId: "",
    DateOfBirth: "",
    PanNo: "",
    FatherName: "",
    Phone: "",
    Address: "",
    Country: "",
    State: "",
    City: "",
  });

  const [readonlyFields, setReadonlyFields] = useState({
    Name: false,
    EmailId: false,
    Phone: false,
  });

  // Prefill from Redux (same as profile page: userDetail + companyDetails)
  useEffect(() => {
    if (!prefillFromProfile.name && !prefillFromProfile.email && !prefillFromProfile.phone) return;
    setFormData((prev) => ({
      ...prev,
      Name: prefillFromProfile.name || prev.Name,
      EmailId: prefillFromProfile.email || prev.EmailId,
      Phone: prefillFromProfile.phone || prev.Phone,
      Address: prefillFromProfile.address || prev.Address,
    }));
    setReadonlyFields((prev) => ({
      ...prev,
      Name: Boolean(prefillFromProfile.name),
      EmailId: Boolean(prefillFromProfile.email),
      Phone: Boolean(prefillFromProfile.phone),
    }));
  }, [prefillFromProfile.name, prefillFromProfile.email, prefillFromProfile.phone, prefillFromProfile.address]);

  const [formErrors, setFormErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [kycCheckLoading, setKycCheckLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [workflowUrl, setWorkflowUrl] = useState(null);
  const [kycDaysUntilExpiry, setKycDaysUntilExpiry] = useState(null);
  const [kycExpired, setKycExpired] = useState(false);
  const [kycExpiringSoon, setKycExpiringSoon] = useState(false);
  const [kycValid, setKycValid] = useState(true);
  const [showRenewForm, setShowRenewForm] = useState(false);

  const countriesReqId = useRef(0);
  const statesReqId = useRef(0);
  const citiesReqId = useRef(0);

  // Page load par last KYC check (pending => workflowUrl dikhao, completed => complete UI)
  useEffect(() => {
    const client_company_id = companyDetails?.companyID ?? "";
    const username = userDetail?.userName ?? "";
    if (!client_company_id || !username) {
      setKycCheckLoading(false);
      return;
    }
    let cancelled = false;
    setKycCheckLoading(true);
    getKycLatest(client_company_id, username)
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res?.status) {
          setKycStatus((res.status || "").toLowerCase());
          setKycData(res.data || null);
          setWorkflowUrl(res.workflowUrl || null);
          setKycDaysUntilExpiry(res.daysUntilExpiry ?? null);
          setKycExpired(!!res.isExpired);
          setKycExpiringSoon(!!res.expiringWithinDays);
          setKycValid(res.isKycValid !== false);
        } else {
          setKycStatus(null);
          setKycData(null);
          setWorkflowUrl(null);
          setKycDaysUntilExpiry(null);
          setKycExpired(false);
          setKycExpiringSoon(false);
          setKycValid(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setKycStatus(null);
          setKycData(null);
          setWorkflowUrl(null);
          setKycDaysUntilExpiry(null);
          setKycExpired(false);
          setKycExpiringSoon(false);
          setKycValid(true);
        }
      })
      .finally(() => {
        if (!cancelled) setKycCheckLoading(false);
      });
    return () => { cancelled = true; };
  }, [companyDetails?.companyID, userDetail?.userName]);

  const loadCountries = useCallback(async () => {
    const reqId = ++countriesReqId.current;
    setLoadingCountries(true);
    try {
      const result = await getCountries();
      if (countriesReqId.current !== reqId) return;
      setCountries(Array.isArray(result?.countries) ? result.countries : []);
    } catch (e) {
      if (countriesReqId.current !== reqId) return;
      setCountries([]);
    } finally {
      if (countriesReqId.current === reqId) setLoadingCountries(false);
    }
  }, []);

  const loadStates = useCallback(async (countryId) => {
    if (!countryId) {
      setStates([]);
      return;
    }
    const reqId = ++statesReqId.current;
    setLoadingStates(true);
    try {
      const result = await getStates(countryId);
      if (statesReqId.current !== reqId) return;
      setStates(Array.isArray(result?.states) ? result.states : []);
    } catch (e) {
      if (statesReqId.current !== reqId) return;
      setStates([]);
    } finally {
      if (statesReqId.current === reqId) setLoadingStates(false);
    }
  }, []);

  const loadCities = useCallback(async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    const reqId = ++citiesReqId.current;
    setLoadingCities(true);
    try {
      const result = await getCities(stateId);
      if (citiesReqId.current !== reqId) return;
      setCities(Array.isArray(result?.cities) ? result.cities : []);
    } catch (e) {
      if (citiesReqId.current !== reqId) return;
      setCities([]);
    } finally {
      if (citiesReqId.current === reqId) setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  // Default country to India (101) when countries are loaded and Country is not set
  const INDIA_COUNTRY_ID = "101";
  useEffect(() => {
    if (countries.length === 0 || formData.Country !== "") return;
    const hasIndia = countries.some((c) => String(c.value) === INDIA_COUNTRY_ID);
    if (hasIndia) {
      setFormData((prev) => ({ ...prev, Country: INDIA_COUNTRY_ID, State: "", City: "" }));
      setStates([]);
      setCities([]);
      loadStates(INDIA_COUNTRY_ID);
    }
  }, [countries, loadStates, formData.Country]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setFormData((prev) => {
        if (name === "Country") {
          return { ...prev, Country: value, State: "", City: "" };
        }
        if (name === "State") {
          return { ...prev, State: value, City: "" };
        }
        if (name === "PanNo") {
          return { ...prev, PanNo: value.toUpperCase() };
        }
        return { ...prev, [name]: value };
      });

      setFormErrors((prev) => ({ ...prev, [name]: "" }));

      if (name === "Country") {
        setCities([]);
        loadStates(value);
      }
      if (name === "State") {
        setCities([]);
        loadCities(value);
      }
    },
    [loadCities, loadStates]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitting(true);

      const validationSchema = Joi.object({
        Name: Joi.string().trim().min(2).required().messages({
          "any.required": "Name is required.",
          "string.empty": "Name is required.",
        }),
        EmailId: Joi.string()
          .trim()
          .email({ tlds: { allow: false } })
          .required()
          .messages({
            "any.required": "Email is required.",
            "string.empty": "Email is required.",
            "string.email": "Invalid email format.",
          }),
        DateOfBirth: Joi.string().trim().required().messages({
          "any.required": "Date of birth is required.",
          "string.empty": "Date of birth is required.",
        }),
        PanNo: Joi.string()
          .trim()
          .uppercase()
          .pattern(PAN_REGEX)
          .required()
          .messages({
            "any.required": "Pan card no is required.",
            "string.empty": "Pan card no is required.",
            "string.pattern.base": "Invalid PAN format (e.g. ABCDE1234F).",
          }),
        FatherName: Joi.string().trim().min(2).required().messages({
          "any.required": "Father name is required.",
          "string.empty": "Father name is required.",
        }),
        Phone: Joi.string()
          .trim()
          .pattern(/^[0-9]{10}$/)
          .required()
          .messages({
            "any.required": "Phone no is required.",
            "string.empty": "Phone no is required.",
            "string.pattern.base": "Phone must be 10 digits.",
          }),
        Address: Joi.string().trim().min(5).required().messages({
          "any.required": "Address is required.",
          "string.empty": "Address is required.",
        }),
        Country: Joi.string().trim().required().messages({
          "any.required": "Country is required.",
          "string.empty": "Country is required.",
        }),
        State: Joi.string().trim().required().messages({
          "any.required": "State is required.",
          "string.empty": "State is required.",
        }),
        City: Joi.string().trim().required().messages({
          "any.required": "City is required.",
          "string.empty": "City is required.",
        }),
      }).unknown(true);

      const validationResponse = await validateFormData(formData, validationSchema);
      if (!validationResponse.status) {
        setFormErrors(validationResponse.errors);
        setSubmitting(false);
        return;
      }

      const client_company_id = companyDetails?.companyID ?? "";
      const username = userDetail?.userName ?? "";
      if (!client_company_id || !username) {
        errorMsg("Company or user session missing. Please log in again.");
        setSubmitting(false);
        return;
      }

      const rawCustomerId = Storage.decryptData(localStorage.getItem("customerID"));
      const customerId = rawCustomerId != null && rawCustomerId !== "" ? String(rawCustomerId).trim() : "";
      const countryName = countries.find((c) => c.value === formData.Country)?.label ?? formData.Country ?? "";
      const stateName = states.find((s) => s.value === formData.State)?.label ?? formData.State ?? "";
      const cityName = cities.find((c) => c.value === formData.City)?.label ?? formData.City ?? "";
      const payload = {
        client_company_id,
        username,
        ...(customerId ? { customerId } : {}),
        email: formData.EmailId.trim(),
        name: formData.Name.trim(),
        phone_no: formData.Phone.trim().replace(/\s/g, ""),
        address: formData.Address.trim(),
        country: countryName,
        state: stateName,
        city: cityName,
        pan_no: formData.PanNo.trim().toUpperCase(),
        father_name: formData.FatherName.trim(),
        dob: formData.DateOfBirth.trim(),
        company_name: companyDetails?.companyName ?? "",
        company_address: companyDetails?.addressStreet ?? "",
        company_logo: companyDetails?.companyLogo ?? "",
      };

      try {
        const res = await postKycRegister(payload);
        if (res && res.success === false) {
          errorMsg(res?.message || "Registration failed.");
          setSubmitting(false);
          return;
        }
        if (res?.success) {
          setShowRenewForm(false);
          if (res.signzy?.contractId || res.signzy?.workflowUrl) {
            await successMsg("KYC registered successfully. E-sign has been initiated. Check your mobile for signing.");
            const openUrl = res.signzy?.workflowUrl || res.signzy?.redirectUrl;
            if (openUrl) {
              window.location.href = openUrl;
            }
            setKycStatus("pending");
            setWorkflowUrl(openUrl || null);
            setKycData({ name: formData.Name, email: formData.EmailId, phone_no: formData.Phone });
          } else if (res.pdfBase64) {
            await successMsg("KYC registered successfully. Agreement PDF will download.");
            const dateStr = new Date()
              .toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
              .replace(/\//g, "-");
            const safeName = (formData.Name || "KYC").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
            downloadAgreementPdf(res.pdfBase64, `KYC_Agreement_${safeName}_${dateStr}.pdf`);
          } else {
            await successMsg("KYC registered successfully.");
          }
          const cid = companyDetails?.companyID ?? "";
          const uname = userDetail?.userName ?? "";
          if (cid && uname) {
            getKycLatest(cid, uname).then((r) => {
              if (r?.success && r?.status) {
                setKycStatus((r.status || "").toLowerCase());
                setKycData(r.data || null);
                setWorkflowUrl(r.workflowUrl || null);
                setKycDaysUntilExpiry(r.daysUntilExpiry ?? null);
                setKycExpired(!!r.isExpired);
                setKycExpiringSoon(!!r.expiringWithinDays);
                setKycValid(r.isKycValid !== false);
              }
            }).catch(() => {});
          }
        } else {
          errorMsg(res?.message || "Registration failed.");
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || "KYC registration failed. Please try again.";
        errorMsg(msg);
      }
      setSubmitting(false);
    },
    [formData, companyDetails, userDetail, countries, states, cities]
  );

  return {
    formData,
    formErrors,
    readonlyFields,
    handleChange,
    handleSubmit,
    submitting,
    loadingCountries,
    loadingStates,
    loadingCities,
    countries,
    states,
    cities,
    kycCheckLoading,
    kycStatus,
    kycData,
    workflowUrl,
    kycDaysUntilExpiry,
    kycExpired,
    kycExpiringSoon,
    kycValid,
    showRenewForm,
    setShowRenewForm,
  };
};

export default useKycRegister;

