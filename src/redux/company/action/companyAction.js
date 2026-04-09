import axios from "#axios";
import { CompanyID } from "#constant/index";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk to fetch module permissions
export const asyncCompanyFetch = createAsyncThunk(
  "company/fetchCompany",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post("/getcinf",{"code":CompanyID});
      return response?.data?.result; // Return the fetched types data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch permissions"
      ); // Return the error message
    }
  }
);