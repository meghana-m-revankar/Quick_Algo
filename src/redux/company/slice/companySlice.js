// file: modulePermissionsSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { asyncCompanyFetch } from "../action/companyAction";
import Cookies from "js-cookie";

const initialState = {
  loading: false,
  error: null,
  companyDetails: null, // Initialize with
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    clearCompany: (state) => {
      state.companyDetails = null;
      state.error = null; // Clear error as well
      Cookies.remove('authToken');
      localStorage.removeItem("riskHomeModal");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(asyncCompanyFetch.pending, (state) => {
        state.loading = true; // Set loading to true when the request starts
        state.error = null; // Clear any previous errors
      })
      .addCase(asyncCompanyFetch.fulfilled, (state, action) => {
        state.loading = false; // Set loading to false when the request finishes
        state.companyDetails = action.payload; // Store the fetched data
        state.error = null; // Clear any previous errors
      })
      .addCase(asyncCompanyFetch.rejected, (state, action) => {
        state.loading = false; // Set loading to false when the request fails
        state.error = action.payload; // Store the error message
      });
  },
});

export const { clearCompany } = companySlice.actions;
export default companySlice.reducer;