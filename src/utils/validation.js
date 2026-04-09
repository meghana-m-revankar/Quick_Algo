import Joi from "joi";
import { validation_message } from "#constant/index";
import { errorMsg } from "#helpers";
import Storage from "#services/storage";
import { clearCompany } from "#redux/company/slice/companySlice.js";

export const validateFormData = async (data, validationSchema) => {
  try {
    validationSchema = validationSchema
      .keys({
        access_token: Joi.string(),
      })
      .messages({
        "any.required": validation_message,
        "any.empty": validation_message,
        "string.empty": validation_message,
        "number.empty": validation_message,
      });

    // Validate the data against the schema
    const { error } = validationSchema.validate(data, { abortEarly: false });

    if (error) {
      const allErrors = {};

      // Format the error messages into a structured object
      error.details.forEach((err) => {
        if (err.path[1] !== undefined && err.path[2] !== undefined) {
          allErrors[err.path[2] + "." + err.path[1]] = err.message.replace(
            /"/g,
            ""
          );
        } else {
          allErrors[err.path[0]] = err.message.replace(/"/g, "");
        }
      });
      return {
        status: false,
        errors: allErrors,
      };
    } else {
      return {
        status: true,
        errors: "",
      };
    }
  } catch (error) {
    return {
      status: false,
      errors: { general: "An unexpected error occurred" },
    };
  }
};

export const handleCatchErrors = (error, navigate, rejectWithValue, path) => {
  if (error?.response?.data?.message) {
    errorMsg(error?.response?.data?.message);
  }
  
  if (error.code === "ERR_NETWORK") {
    // Handle network-related errors
    if (rejectWithValue) {
      navigate("/");
      return rejectWithValue(error.message);
    }
  } else {
    const { status, data } = error.response || {}; // Ensure the response is not undefined
    if (error.response !== undefined) {
      switch (status) {
        case 401:
          // Unauthorized - Remove access token and refresh token from sessionStorage
          Storage?.removeData();
          clearCompany();
          // Navigate to login or the
          navigate("/"); // Redirect to home or login page

          break;

        case 403:
          // Unauthorized - Remove access token and refresh token from sessionStorage
          Storage?.removeData();
          clearCompany();
          navigate("/"); // Redirect to home or login page

          break;

        case 402:
          // Payment Required (e.g., subscription issue)
          if (data.message) {
            errorMsg(data.message);
          }
          break;
        case 405:
          if (data.message) {
            errorMsg(data.message);
          }
          break;

        case 400:
          if (data.message) {
            errorMsg(data.message);
          }
          break;
        case 404:
          // Bad Request / Not Found
          if (data.message) {
            errorMsg(data.message);
          }
          break;

        case 500:
          // Internal Server Error
          if (data.message) {
            errorMsg(data.message);
          }
          break;

        default:
          // Handle unknown error status
          navigate("/");
      }
    }
  }
};
