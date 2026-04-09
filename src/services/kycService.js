import chartAxios from "./chartAxios";

const KYC_REGISTER_URL = "/api/kyc/register";
const KYC_STATUS_URL = "/api/kyc/status";
const KYC_LIST_URL = "/api/kyc/list";
const KYC_DOCUMENT_URL = "/api/kyc/document";
const LOCATION_BASE = "/api/location";

/**
 * POST KYC registration. Backend returns saved KYC data and agreement PDF as base64.
 * @param {Object} payload - { client_company_id, username, email, name, phone_no, address, country, state, city, pan_no, father_name, dob, company_name?, company_address?, price_cost? }
 * @returns {Promise<{ data, pdfBase64? }>}
 */
export const postKycRegister = async (payload) => {
  const response = await chartAxios.post(KYC_REGISTER_URL, payload);
  return response.data;
};

/**
 * GET KYC status by cnid (for kyc-complete / kyc-failed pages).
 * @param {string} cnid - encoded KYC id from URL query
 * @returns {Promise<{ success, status, data }>}
 */
export const getKycStatus = async (cnid) => {
  const response = await chartAxios.get(KYC_STATUS_URL, { params: { cnid } });
  return response.data;
};

/**
 * GET KYC status for logged-in user (kyc page load par check).
 * Same /api/kyc/status with client_company_id & username.
 */
export const getKycLatest = async (client_company_id, username) => {
  const response = await chartAxios.get(KYC_STATUS_URL, {
    params: { client_company_id, username },
  });
  return response.data;
};

/**
 * GET KYC list for logged-in user.
 * @returns {Promise<{ success, list: Array }>}
 */
export const getKycList = async (client_company_id, username) => {
  const response = await chartAxios.get(KYC_LIST_URL, {
    params: { client_company_id, username },
  });
  return response.data;
};

/**
 * GET KYC document (agreement PDF) as base64 for download.
 * @param {string} client_company_id
 * @param {string} username
 * @param {string} [kycId] - optional; specific KYC document id (for history). If omitted, latest is returned.
 * @returns {Promise<{ success, pdfBase64, filename }>}
 */
export const getKycDocument = async (client_company_id, username, kycId) => {
  const params = { client_company_id, username };
  if (kycId) params.kyc_id = kycId;
  const response = await chartAxios.get(KYC_DOCUMENT_URL, { params });
  return response.data;
};

/**
 * GET countries (reactchart location API).
 * @returns {Promise<{ countries: Array<{ value: string, label: string }> }>}
 */
export const getCountries = async () => {
  const response = await chartAxios.get(`${LOCATION_BASE}/countries`);
  const data = response?.data;
  const countries = Array.isArray(data?.countries) ? data.countries : [];
  return { countries };
};

/**
 * GET states by country_id (reactchart location API).
 * @param {string|number} countryId
 * @returns {Promise<{ states: Array<{ value: string, label: string }> }>}
 */
export const getStates = async (countryId) => {
  const response = await chartAxios.get(`${LOCATION_BASE}/states`, {
    params: { country_id: countryId },
  });
  const data = response?.data;
  const states = Array.isArray(data?.states) ? data.states : [];
  return { states };
};

/**
 * GET cities by state_id (reactchart location API).
 * @param {string|number} stateId
 * @returns {Promise<{ cities: Array<{ value: string, label: string }> }>}
 */
export const getCities = async (stateId) => {
  const response = await chartAxios.get(`${LOCATION_BASE}/cities`, {
    params: { state_id: stateId },
  });
  const data = response?.data;
  const cities = Array.isArray(data?.cities) ? data.cities : [];
  return { cities };
};

/**
 * Trigger download of agreement PDF from base64 string.
 * @param {string} base64 - PDF content as base64
 * @param {string} [filename] - e.g. "KYC_Agreement_Name_02-02-2025.pdf"
 */
export const downloadAgreementPdf = (base64, filename = "KYC_Agreement.pdf") => {
  if (!base64) return;
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("downloadAgreementPdf error:", e);
  }
};
