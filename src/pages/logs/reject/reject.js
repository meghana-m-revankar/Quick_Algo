import { DefaultOrder, DefaultPage, PerPageItem } from "#constant/index";
import { asyncGetLogs } from "#redux/logs/action.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogsContext } from "../../../context";
import { useGlobalServices } from "#services/global";

const useRejectedLogs = () => {
  const { activeSubscriptionFeatures } = useGlobalServices();
  const [rejectedLogsList, setRejectedLogsList] = useState([]);
  const [originalLogsList, setOriginalLogsList] = useState([]);
  const { symbolAllCategory } = useContext(LogsContext);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const filterObj = {
    orderStatus: 3,
    categoryId: 0,
  };
  const [filterData, setFilterData] = useState(filterObj);

  const handlePL = (e) => {
    const { name, value } = e.target;
    let filterRejectedLogs = [];
    if (value == 1) {
        filterRejectedLogs = originalLogsList.filter((item) => item.profitLost > 0);
        setRejectedLogsList(filterRejectedLogs);
    }
    if (value == 2) {
        filterRejectedLogs = originalLogsList.filter((item) => item.profitLost <= 0);
        setRejectedLogsList(filterRejectedLogs);
    }
    if (value == 0) {
      getRejectedLogs();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData({ ...filterData, [name]: value });
  };

  const getRejectedLogs = async () => {
    await asyncGetLogs(filterData)
      .then((result) => {
        setRejectedLogsList(result?.data?.result);
        setOriginalLogsList(result?.data?.result);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getRejectedLogs();
  }, [filterData]);

  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState(DefaultOrder);
  const [currentPage, setCurrentPage] = useState(DefaultPage);
  const itemsPerPage = PerPageItem;

  // Search filter
  const filteredData = useMemo(() => {
    return rejectedLogsList?.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, rejectedLogsList]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      if (a[sortColumn] < b[sortColumn]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortColumn] > b[sortColumn]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortColumn, sortOrder]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData?.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData?.length / itemsPerPage);

  const handleSort = (col) => {
    if (col === sortColumn) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortOrder("asc");
    }
  };

  const getPaginationRange = (current, total) => {
    const startPages = [1, 2, 3];
    const endPages = [total - 2, total - 1, total].filter((n) => n > 3);

    const range = [];

    for (let i = 0; i < startPages.length; i++) {
      if (startPages[i] <= total) {
        range.push(startPages[i]);
      }
    }

    if (endPages[0] && endPages[0] > 4) {
      range.push("...");
    }

    for (let i = 0; i < endPages.length; i++) {
      if (!range.includes(endPages[i]) && endPages[i] <= total) {
        range.push(endPages[i]);
      }
    }

    return range;
  };

  const handleClickDialogOpen = (data, tab) => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return {
    rejectedLogsList,
    isLoading,
    getPaginationRange,
    handleSort,
    totalPages,
    paginatedData,
    search,
    sortColumn,
    sortOrder,
    currentPage,
    setCurrentPage,
    setSearch,
    symbolAllCategory,
    filterData,
    handleFilterChange,
    handlePL,
    dialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    activeSubscriptionFeatures,
    navigate,
  };
};

export default useRejectedLogs;
