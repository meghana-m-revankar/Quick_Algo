import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Joi from "joi";
import { errorMsg } from "#helpers";
import { validateFormData, handleCatchErrors } from "#utils/validation";
import { asyncUserSignup } from "#redux/auth/action/authAction.js";

const UserSignUp = () => {
  const navigate = useNavigate();

  const [loading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const { companyDetails } = useSelector((state) => state.companyDetails);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const handleCloseTermsModal = () => setShowTermsModal(false);
  const handleShowTermsModal = () => setShowTermsModal(true);

  const [formData, setFormData] = useState({
    FullName: "",
    Mobile: "",
    EmailId: "",
    EncryptedPassword: "",
    CompanyID: "",
  });

  useEffect(() => {
    if (companyDetails?.companyID) {
      setFormData(prev => ({
        ...prev,
        CompanyID: companyDetails.companyID,
      }));
    }
  }, [companyDetails?.companyID]);
  const [formErrors, setFormErrors] = useState({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }, []);

  const handleCheckboxChange = useCallback(() => {
    setIsChecked(prev => !prev);
    setFormErrors((prev) => ({
      ...prev,
      ["terms_checkbox"]: "",
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationSchema = Joi.object({
      FullName: Joi.string().required().messages({
        "any.required": "FullName is required.",
        "string.empty": "FullName is required.",
      }),
      Mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "any.required": "Mobile number is required.",
        "string.empty": "Mobile number is required.",
        "string.pattern.base": "Mobile number must be exactly 10 digits.",
      }),
      EmailId: Joi.string()
      .email({ tlds: { allow: false } }) // Disables strict TLD checking
      .required()
      .messages({
        "any.required": "Email is required.",
        "string.empty": "Email is required.",
        "string.email": "Invalid email format.",
      }),
      EncryptedPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=(?:.*[0-9]){3,}).*$/)
        .required()
        .messages({
          "any.required": "Password is required.",
          "string.empty": "Password is required.",
          "string.min": "Password must be at least 8 characters long.",
          "string.pattern.base": "Password must contain at least 1 uppercase letter, 1 special character, and 3 numbers.",
        }),
    }).unknown(true);
    
    const validationResponse = await validateFormData(
      formData,
      validationSchema
    );

    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }

    if (!isChecked) {
      setFormErrors((prev) => ({
        ...prev,
        ["terms_checkbox"]: "You must accept the terms and conditions",
      }));
      return;
    }

    setIsLoading(true);
    asyncUserSignup({ formData })
      .then((result) => {
        if (result?.data == "Success") {
          navigate("/");
          setIsLoading(false);
        } else {
          errorMsg(result?.data);
          setIsLoading(false);
        }
      })
      .catch((loginError) => {
        handleCatchErrors(loginError, navigate, setFormErrors, "/");
        setIsLoading(false);
      });
  };

  return {
    formData,
    formErrors,
    isPasswordVisible,
    loading,
    handleSubmit,
    handleChange,
    setIsPasswordVisible,
    showTermsModal,
    handleCloseTermsModal,
    handleShowTermsModal,
    companyDetails,
    handleCheckboxChange,
    isChecked,
  };
};

export default UserSignUp;
