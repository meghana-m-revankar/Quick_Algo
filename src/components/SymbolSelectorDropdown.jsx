import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import "./SymbolSelectorDropdown.scss";

const SymbolSelectorDropdown = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Search symbol...",
  name = "strProduct",
  id = "strProduct",
  valueType = "product", // "product" or "symbolIdentifierId"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(
        (option) =>
          option.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.identifier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    const handleResize = () => {
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      // Calculate position when opening
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  const handleOptionSelect = (option) => {
    // Create a proper event object with preventDefault method
    const syntheticEvent = {
      target: {
        name: name,
        value:
          valueType === "symbolIdentifierId"
            ? option.symbolIdentifierId || option.value
            : option.product || option.value,
      },
      preventDefault: () => {}, // Add preventDefault method
    };

    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const selectedOption = options.find(
    (option) =>
      (valueType === "symbolIdentifierId"
        ? option.symbolIdentifierId || option.value
        : option.product || option.value) === value
  );

  return (
    <div className="symbol-selector-dropdown" ref={dropdownRef}>
      <div
        className={`dropdown-trigger ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
      >
        <div className="selected-value">
          {selectedOption ? selectedOption.product : placeholder}
        </div>
        <FiChevronDown className="dropdown-arrow" />
      </div>

      {isOpen && (
        <div
          className="dropdown-menu"
          style={{
            position: "fixed",
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 999999,
          }}
        >
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  className={`option-item ${
                    (valueType === "symbolIdentifierId"
                      ? option.symbolIdentifierId || option.value
                      : option.product || option.value) === value
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="option-content">
                    <div className="option-symbol">{option.product}</div>
                    <div className="option-name">{option.identifier}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-options">No symbols found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolSelectorDropdown;
