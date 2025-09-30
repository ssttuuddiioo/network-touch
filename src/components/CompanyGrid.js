import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { CompanyItem } from "./CompanyItem";
import { FilterBar } from "./FilterBar";
import { getResponsiveDimensions } from "../AppleWatchDock/settings";
import { loadCompaniesWithCache } from "../data/companies";
import { subscribeToDataChanges } from "../utils/dataStorage";
import { getEmojiPlaceholder, isValidLogoUrl } from "../utils/emojiPlaceholders";

export function CompanyGrid() {
  const [dimensions, setDimensions] = React.useState(() => getResponsiveDimensions());
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // "grid" or "list"
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters] = useState(false); // Keep for FilterBar compatibility
  const location = useLocation();

  const navigate = useNavigate();

  // Get location filter from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const locationFilter = urlParams.get('location');

  // Switch to list view when location filter is applied
  React.useEffect(() => {
    if (locationFilter) {
      setViewMode("list");
    }
  }, [locationFilter]);

  // Update dimensions on window resize
  React.useEffect(() => {
    const handleResize = () => {
      setDimensions(getResponsiveDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load companies from CSV on mount
  React.useEffect(() => {
    const loadData = () => {
      setLoading(true);
      // Clear localStorage cache first
      localStorage.clear();
      console.log('Cleared localStorage cache');
      
      loadCompaniesWithCache(csvCompanies => {
        setCompanies(csvCompanies);
        console.log('Loaded companies in CompanyGrid:', csvCompanies.length);
        setLoading(false);
      });
    };
    
    loadData();

    // Subscribe to admin data changes
    const unsubscribe = subscribeToDataChanges(() => {
      console.log('Admin data changed, reloading companies...');
      loadData();
    });

    return unsubscribe;
  }, []);

  // Filter companies based on industry and location
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesIndustry = selectedIndustries.length === 0 ||
                             selectedIndustries.some(industry => 
                               company.industry.includes(industry)
                             );
      
      const matchesLocation = !locationFilter || 
                             (company.newlabLocation && 
                              company.newlabLocation.toLowerCase() === locationFilter.toLowerCase());
      
      return matchesIndustry && matchesLocation;
    });
  }, [companies, selectedIndustries, locationFilter]);

  // Create grid layout for filtered companies
  const grid = React.useMemo(() => {
    const { rows, cols } = dimensions.grid;
    const gridItems = [];
    
    // Fill grid with filtered companies, repeat if necessary
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const companyIndex = (rowIndex * cols + colIndex) % filteredCompanies.length;
        if (filteredCompanies.length > 0) {
          gridItems.push({
            row: rowIndex,
            col: colIndex,
            company: filteredCompanies[companyIndex],
            id: `${rowIndex}-${colIndex}-${filteredCompanies[companyIndex].id}`
          });
        }
      }
    }
    
    return gridItems;
  }, [dimensions.grid, filteredCompanies]);

  // Calculate initial position to minimize borders and fill screen
  const { device, grid: gridDims } = dimensions;
  const { cellWidth, cellHeight, cols, rows } = gridDims;
  
  const gridWidth = cols * cellWidth;
  const gridHeight = rows * cellHeight;
  
  const initialX = -(gridWidth - device.width) / 2;
  const initialY = -(gridHeight - device.height) / 2;

  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  
  // Track dragging state to prevent accidental clicks
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const DRAG_THRESHOLD = 10; // pixels

  // Calculate drag constraints to minimize borders
  const dragConstraints = {
    left: -(gridWidth - device.width),
    right: 0,
    top: -(gridHeight - device.height), 
    bottom: 0
  };

  // Update motion values when dimensions change
  React.useEffect(() => {
    x.set(initialX);
    y.set(initialY);
  }, [dimensions, x, y, initialX, initialY]);

  // Handle company click (only if not dragging)
  const handleCompanyClick = (company) => {
    if (!isDragging) {
      navigate(`/company/${company.id}`);
    }
  };

  // Get all unique industries for filter
  const allIndustries = useMemo(() => {
    const industries = new Set();
    companies.forEach(company => {
      company.industry.forEach(ind => industries.add(ind));
    });
    return Array.from(industries).sort();
  }, [companies]);

  if (loading) {
    return (
      <motion.div 
        className="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: "18px",
          color: "var(--text-secondary)",
          backgroundColor: "var(--bg-primary)"
        }}
      >
        Loading companies...
      </motion.div>
    );
  }

  if (companies.length === 0) {
    return (
      <motion.div 
        className="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: "18px",
          color: "var(--text-secondary)",
          backgroundColor: "var(--bg-primary)"
        }}
      >
        No companies found. Please check the CSV file.
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="company-grid-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Conditionally show FilterBar */}
      {showFilters && (
        <FilterBar
          selectedIndustries={selectedIndustries}
          onIndustryChange={setSelectedIndustries}
          allIndustries={allIndustries}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}
      
      {/* List Toggle Button - Only show when in grid mode */}
      {viewMode === "grid" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1000
          }}
        >
          <motion.button
            onClick={() => setViewMode("list")}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: "auto",
              minWidth: "200px",
              height: "70px",
              borderRadius: "35px",
              padding: "0 32px",
              backgroundColor: "#4ECDC4",
              color: "#000000",
              border: "2px solid #4ECDC4",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 48px rgba(78, 205, 196, 0.4)",
              backdropFilter: "blur(20px)",
              fontSize: "18px",
              fontWeight: "700",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              letterSpacing: "0.5px",
              pointerEvents: "auto"
            }}
            title="Switch to List View"
          >
            View Company List
          </motion.button>
        </div>
      )}
      
      {viewMode === "grid" ? (
        <div className="device" style={{ ...device, top: showFilters ? 60 : 0, height: showFilters ? "calc(100vh - 60px)" : "100vh" }}>
          <motion.div
            drag
            dragConstraints={dragConstraints}
            onDragStart={(event, info) => {
              dragStartPos.current = { x: info.point.x, y: info.point.y };
              setIsDragging(false); // Reset at start
            }}
            onDrag={(event, info) => {
              const deltaX = Math.abs(info.point.x - dragStartPos.current.x);
              const deltaY = Math.abs(info.point.y - dragStartPos.current.y);
              
              // If movement exceeds threshold, consider it a drag
              if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                setIsDragging(true);
              }
            }}
            onDragEnd={() => {
              // Keep dragging state for a brief moment to prevent immediate clicks
              setTimeout(() => setIsDragging(false), 100);
            }}
            style={{
              width: gridWidth,
              height: gridHeight,
              x,
              y,
              background: "transparent"
            }}
          >
            {grid.map((item) => (
              <CompanyItem 
                key={item.id}
                row={item.row} 
                col={item.col} 
                company={item.company}
                planeX={x} 
                planeY={y}
                dimensions={dimensions}
                onClick={() => handleCompanyClick(item.company)}
                layoutId={`company-${item.company.id}`}
              />
            ))}
          </motion.div>
        </div>
      ) : (
        <CompanyList 
          companies={filteredCompanies}
          onCompanyClick={handleCompanyClick}
          showFilters={showFilters}
          setViewMode={setViewMode}
          locationFilter={locationFilter}
          onClearLocationFilter={() => {
            navigate('/');
            setViewMode("grid");
          }}
        />
      )}
    </motion.div>
  );
}

// Minimalist Company List Component
function CompanyList({ companies, onCompanyClick, showFilters, setViewMode, locationFilter, onClearLocationFilter }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState(companies);
  // Industry color mapping based on the provided color scheme
  const getIndustryColor = (industry) => {
    const industryLower = (industry && industry.toLowerCase()) || '';
    
    if (industryLower.includes('mobility') || industryLower.includes('transportation') || industryLower.includes('automotive')) {
      return '#90EE90'; // Light green
    }
    if (industryLower.includes('manufacturing') || industryLower.includes('production')) {
      return '#D3D3D3'; // Light gray
    }
    if (industryLower.includes('materials') || industryLower.includes('chemical')) {
      return '#98FB98'; // Pale green
    }
    if (industryLower.includes('infrastructure') || industryLower.includes('construction')) {
      return '#DDA0DD'; // Plum
    }
    if (industryLower.includes('agriculture') || industryLower.includes('farming') || industryLower.includes('food')) {
      return '#F0E68C'; // Khaki
    }
    if (industryLower.includes('built environment') || industryLower.includes('real estate') || industryLower.includes('housing')) {
      return '#FFDAB9'; // Peach puff
    }
    if (industryLower.includes('logistics') || industryLower.includes('supply chain') || industryLower.includes('delivery')) {
      return '#AFEEEE'; // Pale turquoise
    }
    if (industryLower.includes('energy') || industryLower.includes('power') || industryLower.includes('renewable')) {
      return '#F0E68C'; // Khaki (same as agriculture for energy)
    }
    if (industryLower.includes('technology') || industryLower.includes('tech') || industryLower.includes('software') || industryLower.includes('ai') || industryLower.includes('robotics')) {
      return '#D3D3D3'; // Light gray (same as manufacturing for tech)
    }
    
    // Default color for other industries
    return '#E0E0E0'; // Light gray
  };

  // Get available tags based on current filter selection
  const availableTags = React.useMemo(() => {
    // If no filters selected, show all tags
    if (selectedTags.length === 0) {
      const tagSet = new Set();
      companies.forEach(company => {
        if (company.industry) {
          company.industry.forEach(tag => tagSet.add(tag));
        }
        if (company.modifiers) {
          company.modifiers.forEach(tag => tagSet.add(tag));
        }
      });
      return Array.from(tagSet).sort();
    }

    // If filters are selected, only show tags that appear in filtered companies
    const tagSet = new Set();
    filteredCompanies.forEach(company => {
      if (company.industry) {
        company.industry.forEach(tag => tagSet.add(tag));
      }
      if (company.modifiers) {
        company.modifiers.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [companies, filteredCompanies, selectedTags]);

  // Filter companies based on selected tags
  React.useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company => {
        const companyTags = [...(company.industry || []), ...(company.modifiers || [])];
        return selectedTags.every(tag => companyTags.includes(tag));
      });
      setFilteredCompanies(filtered);
    }
  }, [companies, selectedTags]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] // Smooth easing curve
      }}
      style={{
        position: "fixed",
        top: showFilters ? "60px" : "0",
        left: "0",
        right: "0",
        bottom: "0",
        backgroundColor: "var(--bg-primary)",
        overflow: "auto",
        padding: "40px 0 350px 0", // Increased bottom padding to 300px
        scrollBehavior: "smooth"
      }}
    >
          <div style={{
            margin: "0 auto",
            padding: "0 50px"
          }}>
            
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                marginBottom: "20px",
                paddingTop: "0px"
              }}
            >
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  marginBottom: "24px",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  marginTop: "0"
                }}
              >
                THE MICHIGAN CENTRAL ECOSYSTEM
              </motion.h2>

              {/* Subtitle */}
              <div
                style={{
                  fontSize: "16px",
                  lineHeight: "22px",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                  marginTop: "-8px",
                  marginBottom: "8px",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
                }}
              >
                A directory of some of the members and partners here
              </div>

              {/* Location Filter Indicator */}
              {locationFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "24px"
                  }}
                >
                  <div style={{
                    padding: "8px 16px",
                    backgroundColor: "#10B981",
                    color: "white",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    📍 {locationFilter}
                  </div>
                  <motion.button
                    onClick={onClearLocationFilter}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                      border: "2px solid var(--border)",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
                    }}
                  >
                    Clear Filter
                  </motion.button>
                </motion.div>
              )}
            </motion.div>

        {filteredCompanies.map((company, index) => (
          <motion.div
            key={company.id}
            initial={{ 
              opacity: 0, 
              y: 60,
              scale: 0.95
            }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1
            }}
            transition={{ 
              delay: index * 0.08,
              duration: 0.7,
              ease: [0.25, 0.46, 0.45, 0.94],
              scale: {
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
              }
            }}
            onClick={() => onCompanyClick(company)}
            style={{
              padding: "20px 0",
              borderBottom: "1px solid var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
              gap: "16px"
            }}
            whileHover={{ 
              backgroundColor: "var(--bg-card)",
              scale: 1.02,
              transition: { 
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94]
              }
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { 
                duration: 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
              }
            }}
          >
            {/* Company Logo/Emoji */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: index * 0.08 + 0.2,
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {!isValidLogoUrl(company.logo) ? (
                <span style={{ 
                  fontSize: "24px",
                  userSelect: "none"
                }}>
                  {getEmojiPlaceholder(company)}
                </span>
              ) : (
                <img 
                  src={company.logo} 
                  alt={company.name}
                  style={{ 
                    width: "80%", 
                    height: "80%", 
                    objectFit: "contain",
                    borderRadius: "50%"
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<span style="font-size: 24px; user-select: none;">${getEmojiPlaceholder(company)}</span>`;
                  }}
                />
              )}
            </motion.div>

            {/* Company Info */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: index * 0.08 + 0.3,
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{ flex: 1, minWidth: 0 }}
            >
              {/* Company Name */}
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.08 + 0.4,
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
                }}
              >
                {company.name}
              </motion.h2>

              {/* Company Description */}
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.08 + 0.5,
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.4",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  maxHeight: "60px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical"
                }}
              >
                {company.description}
              </motion.p>

              {/* Tags and Industry */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.08 + 0.6,
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  alignItems: "center"
                }}
              >
            {/* All Company Tags (Industry + Modifiers) */}
            {[...(company.industry || []), ...(company.modifiers || [])].map((tag, tagIndex) => (
              <motion.span
                key={`${tag}-${tagIndex}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: index * 0.08 + 0.7 + tagIndex * 0.1,
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                whileHover={{ 
                  scale: 1.1,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent company click
                  toggleTag(tag);
                }}
                style={{
                  padding: "4px 10px",
                  backgroundColor: getIndustryColor(tag),
                  color: "#000000",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  cursor: "pointer",
                  // Highlight selected tags with a border
                  border: selectedTags.includes(tag) ? "1px solid var(--text-primary)" : "1px solid transparent",
                  boxShadow: selectedTags.includes(tag) ? "0 0 0 1px rgba(255,255,255,0.3)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                {tag}
              </motion.span>
            ))}

            {/* Location */}
            {company.location && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: index * 0.08 + 0.8,
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                style={{
                  fontSize: "11px",
                  color: "var(--text-primary)",
                  fontWeight: "500",
                  opacity: 0.8
                }}
              >
                {company.location}
              </motion.span>
            )}
              </motion.div>
            </motion.div>

            {/* Right-aligned info */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: index * 0.08 + 0.4,
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                textAlign: "right",
                flexShrink: 0,
                minWidth: "90px"
              }}
            >
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.08 + 0.5,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                fontSize: "12px",
                color: "var(--text-primary)",
                marginBottom: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                fontWeight: "600"
              }}
            >
              {(company.industry && company.industry[0]) || "Technology"}
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.08 + 0.6,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                fontSize: "10px",
                color: "var(--text-primary)",
                opacity: 0.7
              }}
            >
              {company.location || "Detroit"}
            </motion.div>
            </motion.div>
          </motion.div>
        ))}

        {filteredCompanies.length === 0 && companies.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--text-primary)"
            }}
          >
            <p style={{ fontSize: "18px", margin: "0 0 16px 0" }}>
              No companies match the selected filters.
            </p>
            <motion.button
              onClick={() => setSelectedTags([])}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "12px 24px",
                backgroundColor: "var(--accent-primary)",
                color: "var(--bg-primary)",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Clear Filters
            </motion.button>
          </motion.div>
        )}

        {companies.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "var(--text-primary)"
          }}>
            <p style={{ fontSize: "18px", margin: "0" }}>
              No companies match your current filters.
            </p>
          </div>
        )}
      </div>
      
      {/* Tag Filter Section - Fixed at the bottom */}
      <div className="tag-filter-container">
        {/* CTA above filters */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          margin: "0 0 8px 0"
        }}>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            color: "white",
            padding: "14px 28px",
            borderRadius: "40px",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "2px",
            textTransform: "uppercase",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            userSelect: "none"
          }}>
            TOUCH TO EXPLORE
          </div>
        </div>
        {/* Removed "Filter by Industry" header to allow more space for tags */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          maxWidth: "100%"
        }}>
          {/* Clear Filters Button - Only visible when filters are active */}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              style={{
                padding: "12px 24px",
                backgroundColor: "var(--accent-red)",
                color: "white",
                border: "2px solid var(--accent-red)",
                borderRadius: "30px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "700",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 16px rgba(255,0,0,0.3)",
                minWidth: "140px",
                flexShrink: 0
              }}
            >
              Clear All
            </button>
          )}

          {/* Dynamic Tag Filter Pills */}
          <div className="tag-list">
            {availableTags.map((tag) => (
            <button
              key={tag}
              className="tag-button"
              onClick={() => toggleTag(tag)}
              style={{
                backgroundColor: selectedTags.includes(tag) ? getIndustryColor(tag) : "var(--bg-card)",
                color: selectedTags.includes(tag) ? "#000000" : "var(--text-primary)",
                border: `2px solid ${selectedTags.includes(tag) ? getIndustryColor(tag) : "var(--border)"}`,
                boxShadow: selectedTags.includes(tag) ? "0 4px 12px rgba(0,0,0,0.2)" : "none"
              }}
            >
              {tag}
            </button>
          ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
