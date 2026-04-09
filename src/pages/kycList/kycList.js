import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { errorMsg } from "#helpers";
import { getKycList, getKycDocument, downloadAgreementPdf } from "#services/kycService";

const useKycList = () => {
  const { userDetail } = useSelector((state) => state.userDetails);
  const { companyDetails } = useSelector((state) => state.companyDetails);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const client_company_id = companyDetails?.companyID ?? "";
  const username = userDetail?.userName ?? "";

  const fetchList = useCallback(async () => {
    if (!client_company_id || !username) {
      setLoading(false);
      setList([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getKycList(client_company_id, username);
      if (res?.success && Array.isArray(res?.list)) {
        setList(res.list);
      } else {
        setList([]);
      }
    } catch (e) {
      setList([]);
      errorMsg("Failed to load KYC list.");
    } finally {
      setLoading(false);
    }
  }, [client_company_id, username]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDownloadDocument = useCallback(
    async (item) => {
      if (!client_company_id || !username) return;
      setDownloadingId(item?.id ?? "current");
      try {
        const res = await getKycDocument(client_company_id, username, item?.id);
        if (res?.success && res?.pdfBase64) {
          downloadAgreementPdf(res.pdfBase64, res.filename || "KYC_Agreement.pdf");
        } else {
          errorMsg(res?.message || "Document not available.");
        }
      } catch (e) {
        errorMsg("Failed to download KYC document.");
      } finally {
        setDownloadingId(null);
      }
    },
    [client_company_id, username]
  );

  return {
    list,
    loading,
    downloadingId,
    handleDownloadDocument,
  };
};

export default useKycList;
