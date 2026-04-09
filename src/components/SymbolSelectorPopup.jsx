import React, { useState, useEffect, useCallback } from "react";
import { fetchWatchList } from "#utils/watchList";
import { useTradingBox } from "#context/TradingBoxContext";
import { FontAwesomeIcons } from "#components";
import "./SymbolSelectorPopup.scss";

const SymbolSelectorPopup = ({ isOpen, onClose }) => {
  const [topSymbols, setTopSymbols] = useState([]);
  const [bseSymbols, setBseSymbols] = useState([]);
  const [filteredBseSymbols, setFilteredBseSymbols] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addTradingBox } = useTradingBox();

  // Top 3 most popular symbols (you can modify this list)
  const topSymbolsList = ["NIFTY", "BANKNIFTY", "FINNIFTY"];

  // Fetch top symbols data
  const fetchTopSymbols = useCallback(async () => {
    try {
      const symbolsData = await fetchWatchList({
        categoryID: 5,
        identifier: "",
      });

      if (symbolsData && Array.isArray(symbolsData)) {
        const topSymbolsData = topSymbolsList
          .map((symbolName) => {
            const symbol = symbolsData.find((s) =>
              s?.identifier?.toUpperCase().includes(symbolName)
            );
            return symbol;
          })
          .filter(Boolean);

        setTopSymbols(topSymbolsData);
      }
    } catch (error) {
    }
  }, [topSymbolsList]);

  // Fetch BSE symbols
  const fetchBseSymbols = useCallback(async () => {
    try {
      setIsLoading(true);
      const symbolsData = await fetchWatchList({
        categoryID: 12,
        identifier: "",
      });

      if (symbolsData && Array.isArray(symbolsData)) {
        setBseSymbols(symbolsData);
        setFilteredBseSymbols(symbolsData);
      }
    } catch (error) {
      // Error fetching BSE symbols
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter BSE symbols based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBseSymbols(bseSymbols);
    } else {
      const filtered = bseSymbols.filter(
        (symbol) =>
          symbol?.identifier
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          symbol?.symbolName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBseSymbols(filtered);
    }
  }, [searchTerm, bseSymbols]);

  // Load data when popup opens
  useEffect(() => {
    if (isOpen) {
      fetchTopSymbols();
      fetchBseSymbols();
    }
  }, [isOpen, fetchTopSymbols, fetchBseSymbols]);

  // Handle symbol selection
  const handleSymbolSelect = (symbol) => {
    addTradingBox(symbol);
    onClose();
    setSearchTerm("");
  };

  // Handle close
  const handleClose = () => {
    onClose();
    setSearchTerm("");
  };

  if (!isOpen) return null;

  return (
    <div className="symbol-selector-overlay" onClick={handleClose}>
      <div
        className="symbol-selector-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-header">
          <h3>Select Symbol</h3>
          <button className="close-btn" onClick={handleClose}>
            <FontAwesomeIcons name="times" />
          </button>
        </div>

        <div className="popup-content">
          {/* Top Symbols Section */}
          <div className="top-symbols-section">
            <h4>Popular Symbols</h4>
            <div className="top-symbols-grid">
              {topSymbols.map((symbol, index) => (
                <button
                  key={index}
                  className="symbol-btn top-symbol"
                  onClick={() => handleSymbolSelect(symbol)}
                >
                  <div className="symbol-name">
                    {symbol?.identifier || topSymbolsList[index]}
                  </div>
                  <div className="symbol-details">
                    {symbol?.symbolName || ""}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* BSE Symbols Section */}
          <div className="bse-symbols-section">
            <h4>All BSE Symbols</h4>

            {/* Search Bar */}
            <div className="search-container">
              <FontAwesomeIcons name="search" className="search-icon" />
              <input
                type="text"
                placeholder="Search symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Symbols List */}
            <div className="symbols-list">
              {isLoading ? (
                <div className="loading">Loading symbols...</div>
              ) : filteredBseSymbols.length > 0 ? (
                filteredBseSymbols.map((symbol, index) => (
                  <button
                    key={index}
                    className="symbol-btn bse-symbol"
                    onClick={() => handleSymbolSelect(symbol)}
                  >
                    <div className="symbol-name">
                      {symbol?.identifier || symbol?.symbolName}
                    </div>
                    <div className="symbol-details">
                      {symbol?.symbolName || ""}
                    </div>
                  </button>
                ))
              ) : (
                <div className="no-results">
                  {searchTerm ? "No symbols found" : "No symbols available"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymbolSelectorPopup;
