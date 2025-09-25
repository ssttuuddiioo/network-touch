import React, { useState } from "react";
import { motion } from "framer-motion";

export function FilterBar({ 
  selectedIndustries, 
  onIndustryChange, 
  allIndustries,
  viewMode,
  onViewModeChange
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleIndustryToggle = (industry) => {
    if (selectedIndustries.includes(industry)) {
      onIndustryChange(selectedIndustries.filter(i => i !== industry));
    } else {
      onIndustryChange([...selectedIndustries, industry]);
    }
  };

  const clearFilters = () => {
    onIndustryChange([]);
  };

  return (
    <motion.div 
      className="filter-bar"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--glass)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 20px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap"
      }}
    >


      {/* Filter Toggle */}
      <motion.button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        style={{
          padding: "8px 16px",
          backgroundColor: isFilterOpen ? "var(--accent-primary)" : "var(--bg-card)",
          color: isFilterOpen ? "var(--bg-primary)" : "var(--text-primary)",
          border: "1px solid var(--accent-primary)",
          borderRadius: "20px",
          cursor: "pointer",
          fontSize: "14px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: "600"
        }}
        whileTap={{ scale: 0.95 }}
      >
        <span role="img" aria-label="Search">🔍</span> Filters {selectedIndustries.length > 0 && `(${selectedIndustries.length})`}
      </motion.button>

      {/* View Mode Toggle */}
      <div style={{ display: "flex", backgroundColor: "var(--bg-card)", borderRadius: "20px", padding: "2px", border: "1px solid var(--border)" }}>
        <motion.button
          onClick={() => onViewModeChange("grid")}
          style={{
            padding: "6px 12px",
            backgroundColor: viewMode === "grid" ? "var(--accent-primary)" : "transparent",
            color: viewMode === "grid" ? "var(--bg-primary)" : "var(--text-secondary)",
            border: "none",
            borderRadius: "18px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: "500"
          }}
          whileTap={{ scale: 0.95 }}
        >
          <span role="img" aria-label="Grid view">⚪</span> Grid
        </motion.button>
        <motion.button
          onClick={() => onViewModeChange("list")}
          style={{
            padding: "6px 12px",
            backgroundColor: viewMode === "list" ? "var(--accent-primary)" : "transparent",
            color: viewMode === "list" ? "var(--bg-primary)" : "var(--text-secondary)",
            border: "none",
            borderRadius: "18px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: "500"
          }}
          whileTap={{ scale: 0.95 }}
        >
          <span role="img" aria-label="List view">📋</span> List
        </motion.button>
      </div>



      {/* Industry Filters Dropdown */}
      {isFilterOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute",
            top: "100%",
            left: "20px",
            right: "20px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 8px 32px var(--shadow)",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "bold", marginRight: "8px", color: "var(--text-primary)" }}>
            Industries:
          </span>
          
          {allIndustries.map(industry => (
            <motion.button
              key={industry}
              onClick={() => handleIndustryToggle(industry)}
              style={{
                padding: "6px 14px",
                backgroundColor: selectedIndustries.includes(industry) ? "var(--accent-primary)" : "var(--bg-tertiary)",
                color: selectedIndustries.includes(industry) ? "var(--bg-primary)" : "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: "500"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {industry}
            </motion.button>
          ))}
          
          {selectedIndustries.length > 0 && (
            <motion.button
              onClick={clearFilters}
              style={{
                padding: "6px 14px",
                backgroundColor: "#ff6b6b",
                color: "white",
                border: "1px solid #ff6b6b",
                borderRadius: "16px",
                cursor: "pointer",
                fontSize: "12px",
                marginLeft: "8px",
                fontWeight: "500"
              }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
