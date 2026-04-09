import { DefaultOrder, DefaultPage, PerPageItem } from "#constant/index";
import { asyncGetLogs } from "#redux/logs/action.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext, LogsContext } from "../../../context";
import { useGlobalServices } from "#services/global";

const useActiveLogs = () => {
  const { activeSubscriptionFeatures } = useGlobalServices();
  const [activeLogsList, setActiveLogsList] = useState([]);
  const [totalPL, setTotalPL] = useState(0);
  const [originalLogsList, setOriginalLogsList] = useState([]);
  const { symbolAllCategory } = useContext(LogsContext);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClickDialogOpen = (data, tab) => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const filterObj = {
    orderStatus: 1,
    categoryId: 0,
  };
  const [filterData, setFilterData] = useState(filterObj);

  const handlePL = (e) => {
    const { name, value } = e.target;
    let filterActiveLogs = [];
    if (value == 1) {
      filterActiveLogs = originalLogsList.filter((item) => item.profitLost > 0);
      setActiveLogsList(filterActiveLogs);
    }
    if (value == 2) {
      filterActiveLogs = originalLogsList.filter(
        (item) => item.profitLost <= 0
      );
      setActiveLogsList(filterActiveLogs);
    }
    if (value == 0) {
      getActiveLogs();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData({ ...filterData, [name]: value });
  };

  const getActiveLogs = async () => {
    await asyncGetLogs(filterData)
      .then((result) => {
        setActiveLogsList(result?.data?.result);
        setOriginalLogsList(result?.data?.result);
        setTotalPL(
          result?.data?.result.reduce((sum, item) => sum + item.profitLost, 0)
        );
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getActiveLogs();
  }, [filterData]);

  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState(DefaultOrder);
  const [currentPage, setCurrentPage] = useState(DefaultPage);
  const itemsPerPage = PerPageItem;

  // Search filter
  const filteredData = useMemo(() => {
    return activeLogsList?.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, activeLogsList]);

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

  return {
    activeLogsList,
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
    navigate
  };
};

export default useActiveLogs;
