import { useContext, useMemo, useState } from "react";
import { GlobalContext, OrderContext } from "../../../context";
import { DefaultOrder, DefaultPage, PerPageItem } from "#constant/index";
import { useNavigate } from "react-router-dom";
import { useGlobalServices } from "#services/global";

const useActiveOrder = () => {
  const {
    isLoading,
    activeOrderList,
    symbolCategory,
    filterData,
    handleFilterChange,
    isFilter,
    setIsFilter,
    resetFilter,
    handleOrderExit,
    totalBuy,
    todayPL,
    closedOrderList,
  } = useContext(OrderContext);
  const { activeSubscriptionFeatures } = useGlobalServices();
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState(DefaultOrder);
  const [currentPage, setCurrentPage] = useState(DefaultPage);
  const [showData, setShowData] = useState(true);
  const itemsPerPage = PerPageItem;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [singleOrderData, setSingleOrderData] = useState("");
  const [defaultTabOpen, setDefaultTabOpen] = useState("");

  const navigate = useNavigate();
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

  const [dialogSubOpen, setDialogSubOpen] = useState(false);
  const handleClickSubDialogOpen = (data, tab) => {
    setDialogSubOpen(true);
  };

  const handleDialogSubClose = () => {
    setDialogSubOpen(false);
  };

  // Search filter
  const filteredData = useMemo(() => {
    return activeOrderList?.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, activeOrderList]);

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
    handleOrderExit,
    totalBuy,
    activeOrderList,
    todayPL,
    closedOrderList,
    dialogSubOpen,
    setDialogSubOpen,
    handleClickSubDialogOpen,
    handleDialogSubClose,
    activeSubscriptionFeatures,
    showData,
    setShowData,
    navigate
  };
};

export default useActiveOrder;
