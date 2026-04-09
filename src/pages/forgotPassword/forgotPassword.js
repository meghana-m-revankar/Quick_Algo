import React, { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { handleCatchErrors, validateFormData } from "#utils/validation";
import { useNavigate } from "react-router-dom";
import Joi from "joi";
import { asyncCustForgotpassword } from "#redux/auth/action/authAction.js";
import { errorMsg, successMsg } from "#helpers";

const useForgotPassword = () => {
  const { companyDetails } = useSelector((state) => state.companyDetails);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setIsLoading] = useState(false);

  const [isChecked, setIsChecked] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    CompanyID: "",
    EmailId: "",
  });

  useEffect(() => {
    if (companyDetails?.companyID) {
      setFormData(prev => ({
        ...prev,
        CompanyID: companyDetails.companyID,
      }));
    }
  }, [companyDetails?.companyID]);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const handleCloseTermsModal = () => setShowTermsModal(false);
  const handleShowTermsModal = () => setShowTermsModal(true);

  const handleCheckboxChange = useCallback(() => {
    setIsChecked(prev => !prev);
    setFormErrors((prev) => ({
      ...prev,
      ["terms_checkbox"]: "",
    }));
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationSchema = Joi.object({
      EmailId: Joi.string()
        .email({ tlds: { allow: false } }) // Disables strict TLD checking
        .required()
        .messages({
          "any.required": "Email is required.",
          "string.empty": "Email is required.",
          "string.email": "Invalid email format.",
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
    asyncCustForgotpassword({ formData })
      .then((result) => {
        if (result?.data) {
          successMsg("Please check your mail.");
        } else {
          errorMsg("Email is not exist");
        }
      })
      .catch((loginError) => {
        errorMsg("Please try again");
        handleCatchErrors(loginError, navigate, setFormErrors, "/");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return {
    formErrors,
    loading,
    formData,
    handleSubmit,
    handleChange,
    showTermsModal,
    handleCloseTermsModal,
    handleShowTermsModal,
    handleCheckboxChange,
    isChecked,
    companyDetails,
  };
};

export default useForgotPassword;
