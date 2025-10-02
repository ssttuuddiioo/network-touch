import React from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { loadCompaniesFromCSV } from "../data/companies";
import { subscribeToDataChanges } from "../utils/dataStorage";
import { getEmojiPlaceholder, isValidLogoUrl } from "../utils/emojiPlaceholders";
import CompanyQRCode from './CompanyQRCode';
import CompanyImage from './CompanyImage';

// Generate placeholder image URL
const getPlaceholderImage = (name, index) => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96C93F', 'FFEAA7', 'DDA0DD'];
  const colorIndex = (name.length + index) % colors.length;
  return `https://via.placeholder.com/800x400/${colors[colorIndex]}/FFFFFF?text=${encodeURIComponent(name)}`;
};

export function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [useEmojiLogo, setUseEmojiLogo] = React.useState(false);
  const [navigationDirection, setNavigationDirection] = React.useState(null);
  const [timeRemaining, setTimeRemaining] = React.useState(90); // 90 seconds = 1 minute 30 seconds

  // Find company by ID or by partial name match
  const findCompanyByIdOrName = (companies, searchId) => {
    // First try exact ID match
    const searchIdStr = String(searchId);
    const exactMatch = companies.find(c => String(c.id) === searchIdStr);
    if (exactMatch) return exactMatch;
    
    // If no exact match, try to find by partial name match
    const searchTerm = searchId.toLowerCase();
    const partialMatch = companies.find(c => 
      c.name.toLowerCase().includes(searchTerm) || 
      searchTerm.includes(c.name.toLowerCase())
    );
    
    // If partial match found, log it for debugging
    if (partialMatch) {
      console.log(`Found company "${partialMatch.name}" by partial match with search term "${searchId}"`);
    }
    
    return partialMatch;
  };
  
  const company = findCompanyByIdOrName(companies, id);

  const handleExploreLocation = () => {
    if (company && company.newlabLocation) {
      // Navigate to list view with location filter
      navigate(`/?location=${encodeURIComponent(company.newlabLocation)}`);
    }
  };

  // Navigation functions for company browsing
  const currentIndex = company ? companies.findIndex(c => c.id === company.id) : -1;
  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < companies.length - 1;

  const handlePrevCompany = () => {
    if (canNavigatePrev) {
      setNavigationDirection('left');
      const prevCompany = companies[currentIndex - 1];
      navigate(`/company/${prevCompany.id}`);
    }
  };

  const handleNextCompany = () => {
    if (canNavigateNext) {
      setNavigationDirection('right');
      const nextCompany = companies[currentIndex + 1];
      navigate(`/company/${nextCompany.id}`);
    }
  };

  // Load companies from CSV on mount
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const csvCompanies = await loadCompaniesFromCSV();
        setCompanies(csvCompanies);
        console.log('Loaded companies in CompanyDetail:', csvCompanies.length);
        
        // Check if we need to redirect to the correct company URL
        if (csvCompanies.length > 0) {
          const foundCompany = findCompanyByIdOrName(csvCompanies, id);
          if (foundCompany && foundCompany.id !== id) {
            // Redirect to the correct URL with the proper ID
            console.log(`Redirecting from "${id}" to proper company ID "${foundCompany.id}"`);
            navigate(`/company/${foundCompany.id}`, { replace: true });
          }
        }
      } catch (error) {
        console.error('Failed to load companies:', error);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    // Subscribe to admin data changes
    const unsubscribe = subscribeToDataChanges(() => {
      console.log('Admin data changed, reloading company details...');
      loadData();
    });

    return unsubscribe;
  }, [id, navigate]);

  // Check if we should use emoji for the logo
  React.useEffect(() => {
    if (company) {
      setUseEmojiLogo(!isValidLogoUrl(company.logo));
    }
  }, [company]);

  // Reset navigation direction after company changes
  React.useEffect(() => {
    if (navigationDirection) {
      const timer = setTimeout(() => {
        setNavigationDirection(null);
      }, 600); // Reset after animation completes
      return () => clearTimeout(timer);
    }
  }, [navigationDirection]);
  
  // Auto-navigate back to directory list after 1 minute 30 seconds of inactivity
  React.useEffect(() => {
    // Reset timer when component mounts or company changes
    setTimeRemaining(90);
    
    // Update timer every second
    const timerInterval = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          // Time's up, navigate back to directory
          navigate('/');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Reset timer on any user interaction
    const resetTimer = () => {
      setTimeRemaining(90);
    };
    
    // Add event listeners for various user interactions
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('touchmove', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('wheel', resetTimer);
    
    // Clean up interval and event listeners when component unmounts or company changes
    return () => {
      clearInterval(timerInterval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('touchmove', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('wheel', resetTimer);
    };
  }, [navigate, id]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && canNavigatePrev) {
        handlePrevCompany();
      } else if (e.key === 'ArrowRight' && canNavigateNext) {
        handleNextCompany();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canNavigatePrev, canNavigateNext, handlePrevCompany, handleNextCompany]);

  if (loading) {
    return (
      <motion.div
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
        Loading company details...
      </motion.div>
    );
  }

  if (!company) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: "24px",
          color: "var(--text-secondary)",
          backgroundColor: "var(--bg-primary)"
        }}
      >
        Company not found
      </motion.div>
    );
  }

  const handleBack = () => {
    navigate("/");
  };

  return (
    <motion.div
      className="company-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: "100vh",
        backgroundColor: "#121212", // Dark background
        position: "relative",
        color: "white"
      }}
    >



      {/* Main Content */}
      <motion.main 
        key={id} // Force re-render for each company
        initial={{ 
          opacity: 0, 
          x: navigationDirection === 'left' ? -100 : navigationDirection === 'right' ? 100 : 0 
        }}
        animate={{ 
          opacity: 1, 
          x: 0 
        }}
        exit={{ 
          opacity: 0, 
          x: navigationDirection === 'left' ? 100 : navigationDirection === 'right' ? -100 : 0 
        }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
          style={{ 
          padding: "200px 0 0", 
          maxWidth: "67.5%",
          margin: "0 auto",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 7.5px 22.5px rgba(0,0,0,0.3)"
        }}
      >
        
        {/* Large Photo Section - Now at the top with logo overlay */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            margin: "0 auto 15px",
            overflow: "hidden",
            backgroundColor: "transparent",
            width: "100%",
            aspectRatio: "3.5/3.3",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <CompanyImage
              company={company}
              imageType="photo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "18px"
              }}
           />
           
          {/* Logo overlay in top left corner */}
          <motion.div
            layoutId={`company-${company.id}`}
            style={{
              position: "absolute",
              top: "15px",
              left: "15px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: "white",
              border: "1.5px solid white",
              boxShadow: "0 3px 12px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10
            }}
          >
            <CompanyImage 
                company={company}
                imageType="logo"
                style={{
                  width: "80%",
                  height: "80%",
                  objectFit: "contain"
                }}
            />
          </motion.div>
        </motion.section>
        
        {/* Company Name, QR Code, Description, and Tags Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            margin: "0 0 15px",
            backgroundColor: "#121212",
            padding: "15px 0",
          }}
        >
          {/* Content Grid - QR Code on left, Company Name, Description and Tags on right */}
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "15px",
            alignItems: "start"
          }}>
            {/* QR Code Card - Left Side */}
            <div style={{
              padding: "12px",
              backgroundColor: "#1E1E1E", // Dark card background
              borderRadius: "9px",
              border: "1px solid #333",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: "120px",
              position: "relative",
              overflow: "hidden",
              alignSelf: "flex-start"
            }}>
              <p style={{
                color: "#999",
                fontSize: "9px",
                textAlign: "center",
                margin: "0 0 9px 0",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.375px",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}>
                COMPANY WEBSITE
              </p>
              <div style={{
                backgroundColor: "white",
                padding: "7.5px",
                borderRadius: "6px"
              }}>
                <CompanyQRCode companyId={company.id} size={96} />
              </div>
            </div>

            {/* Right side content */}
            <div>
              {/* Company Name */}
              <h2 style={{ 
                margin: "0 0 15px 0", 
                fontSize: "31.5px", 
                color: "white",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: "600",
              }}>
                {company.name}
              </h2>

              {/* Description and Tags */}
              {/* Description */}
              <div style={{ marginBottom: "15px" }}>
                <p style={{
                  fontSize: "13.5px",
                  color: "white",
                  lineHeight: "1.6",
                  margin: "0",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  opacity: 0.9
                }}>
                  {company.description}
                </p>
              </div>

              {/* CTA removed per request (only on main page) */}

              {/* Industry Tags */}
              {((company.industry && company.industry.length > 0) || (company.modifiers && company.modifiers.length > 0)) && (
                <div
                  style={{
                    display: "flex",
                    gap: "9px",
                    flexWrap: "wrap",
                    alignContent: "flex-start"
                  }}
                >
                  {/* Industry Tags */}
                  {company.industry && company.industry.map((industry, index) => (
                    <div
                      key={`industry-${index}`}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#90EE90", // Light green based on your color scheme
                        color: "#000000",
                        borderRadius: "22.5px",
                        fontSize: "9px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.375px",
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
                      }}
                    >
                      {industry}
                    </div>
                  ))}

                  {/* Modifier Tags */}
                  {company.modifiers && company.modifiers.map((modifier, index) => (
                    <div
                      key={`modifier-${index}`}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#D3D3D3", // Light gray based on your color scheme
                        color: "#000000",
                        borderRadius: "22.5px",
                        fontSize: "9px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.375px",
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
                      }}
                    >
                      {modifier}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Navigation Arrows and Back Button - Centered */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 0 15px"
          }}
        >
          {/* Navigation Arrows */}
          {companies.length > 1 && (
            <div style={{
              display: "flex",
              gap: "11.25px",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* Previous Company Arrow */}
              <motion.button
                onClick={handlePrevCompany}
                disabled={!canNavigatePrev}
                whileHover={canNavigatePrev ? { scale: 1.1 } : {}}
                whileTap={canNavigatePrev ? { scale: 0.95 } : {}}
                style={{
                  width: "33.75px",
                  height: "33.75px",
                  borderRadius: "50%",
                  backgroundColor: canNavigatePrev ? "#333" : "#222",
                  border: "none",
                  cursor: canNavigatePrev ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  color: canNavigatePrev ? "white" : "#555",
                  boxShadow: canNavigatePrev ? "0 3px 9px rgba(0,0,0,0.3)" : "none",
                  opacity: canNavigatePrev ? 1 : 0.5
                }}
              >
                ←
              </motion.button>

              {/* Next Company Arrow */}
              <motion.button
                onClick={handleNextCompany}
                disabled={!canNavigateNext}
                whileHover={canNavigateNext ? { scale: 1.1 } : {}}
                whileTap={canNavigateNext ? { scale: 0.95 } : {}}
                style={{
                  width: "33.75px",
                  height: "33.75px",
                  borderRadius: "50%",
                  backgroundColor: canNavigateNext ? "#333" : "#222",
                  border: "none",
                  cursor: canNavigateNext ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  color: canNavigateNext ? "white" : "#555",
                  boxShadow: canNavigateNext ? "0 3px 9px rgba(0,0,0,0.3)" : "none",
                  opacity: canNavigateNext ? 1 : 0.5
                }}
              >
                →
              </motion.button>
            </div>
          )}

          {/* Back to Directory Button */}
          <motion.button
            onClick={handleBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "12px 18px",
              backgroundColor: "#F8D57E", // Yellow color from screenshot
              color: "#000000",
              border: "none",
              borderRadius: "22.5px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              boxShadow: "0 3px 9px rgba(0,0,0,0.2)"
            }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            ← Back to Directory
          </motion.button>
        </motion.section>


{/* Timer functionality is still active but visual indicator is hidden */}
        
        {/* Add bottom padding */}
        <div style={{ height: "30px" }}></div>
      </motion.main>
    </motion.div>
  );
}

