import { DefaultOrder, DefaultPage, PerPageItem } from "#constant/index";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { OrderContext } from "../../../context";
import { useNavigate } from "react-router-dom";
import {
  asyncGetOrderListClosed,
  asyncGetOrderListRejected,
} from "#redux/order/action.js";
import { handleCatchErrors } from "#utils/validation";

const useRejectedOrder = () => {
  const { symbolCategory } = useContext(OrderContext);

  const [isFilter, setIsFilter] = useState(false);
  const navigate = useNavigate();
  const filterObj = {
    AutoOrder: 0,
    indentifier: "",
    Pl: 0,
    CategoryId: 0,
  };
  const [filterData, setFilterData] = useState(filterObj);
  const [rejectedOrderList, setRejectedOrderList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData({ ...filterData, [name]: value });
  };

  useEffect(() => {
    asyncGetOrderListRejected(filterData)
      .then((result) => {
        if (Array.isArray(result?.data?.result)) {
          setRejectedOrderList(result?.data?.result);
        }
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [filterData]);

  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState(DefaultOrder);
  const [currentPage, setCurrentPage] = useState(DefaultPage);
  const itemsPerPage = PerPageItem;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [singleOrderData, setSingleOrderData] = useState("");
  const [defaultTabOpen, setDefaultTabOpen] = useState("");

  const handleClickDialogOpen = (data, tab) => {
    setDialogOpen(true);
    setSingleOrderData(data);
    setDefaultTabOpen(tab);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSingleOrderData("");
    setDefaultTabOpen("");
  };

  // Search filter
  const filteredData = useMemo(() => {
    return rejectedOrderList?.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, rejectedOrderList]);

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
  const [portfolio, setProtfolio] = useState({
    totalActiveprice1: 0,
    totalActiveprice: 0,
    totalisTakeProfit: 0,
    todaysPL: 0,
    totalisTakeProfit1: 0,
    currentValue: 0,
  });

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

  const resetFilter = () => {
    setFilterData(filterObj);
  };

  return {
    getPaginationRange,
    portfolio,
    setProtfolio,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    sortColumn,
    setSortColumn,
    sortOrder,
    setSortOrder,
    paginatedData,
    handleSort,
    totalPages,
    symbolCategory,
    filterData,
    handleFilterChange,
    isFilter,
    setIsFilter,
    resetFilter,
    isLoading,
    handleClickDialogOpen,
    handleDialogClose,
    dialogOpen,
    singleOrderData,
    defaultTabOpen,
    rejectedOrderList,
  };
};

export default useRejectedOrder;
