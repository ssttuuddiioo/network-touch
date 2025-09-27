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

  const company = companies.find(c => c.id === id);

  const handleExploreLocation = () => {
    if (company && company.newlabLocation) {
      // Navigate to list view with location filter
      navigate(`/?location=${encodeURIComponent(company.newlabLocation)}`);
    }
  };

  // Navigation functions for company browsing
  const currentIndex = companies.findIndex(c => c.id === id);
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
  }, []);

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
          padding: "20px 0 0", 
          maxWidth: "90%",
          margin: "0 auto",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
        }}
      >
        
        {/* Image Container with Description Overlay */}
        <div style={{
          position: "relative",
          width: "100%",
          marginBottom: "20px"
        }}>
          {/* Large Photo Section - Now at the top with logo overlay */}
          <motion.section
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              margin: "0 auto",
              overflow: "hidden",
              backgroundColor: "transparent",
              width: "100%",
              aspectRatio: "3.5/4",
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
                  borderRadius: "24px"
                }}
             />
             
            {/* Logo overlay in top left corner */}
            <motion.div
              layoutId={`company-${company.id}`}
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "white",
                border: "2px solid white",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
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
          
          {/* Description Overlay - Positioned 300px higher */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              position: "absolute",
              bottom: "300px",
              left: 0,
              right: 0,
              padding: "20px",
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              zIndex: 5
            }}
          >
            {/* Company Name */}
            <h2 style={{ 
              margin: "0 0 20px 0", 
              fontSize: "42px", 
              color: "white",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: "600",
            }}>
              {company.name}
            </h2>
            
            {/* Description */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{
                fontSize: "18px",
                color: "white",
                lineHeight: "1.6",
                margin: "0",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                opacity: 0.9
              }}>
                {company.description}
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Company Name, QR Code, Description, and Tags Section */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            margin: "0 0 20px",
            backgroundColor: "#121212",
            padding: "20px 0",
          }}
        >
          {/* Content Grid - QR Code on left, Company Name, Description and Tags on right */}
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "20px",
            alignItems: "start"
          }}>
            {/* QR Code Card - Left Side */}
            <div style={{
              padding: "16px",
              backgroundColor: "#1E1E1E", // Dark card background
              borderRadius: "12px",
              border: "1px solid #333",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: "160px",
              position: "relative",
              overflow: "hidden",
              alignSelf: "flex-start"
            }}>
              <p style={{
                color: "#999",
                fontSize: "12px",
                textAlign: "center",
                margin: "0 0 12px 0",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}>
                COMPANY WEBSITE
              </p>
              <div style={{
                backgroundColor: "white",
                padding: "10px",
                borderRadius: "8px"
              }}>
                <CompanyQRCode companyId={company.id} size={128} />
              </div>
            </div>

            {/* Right side content */}
            <div>

              {/* Industry Tags */}
              {((company.industry && company.industry.length > 0) || (company.modifiers && company.modifiers.length > 0)) && (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    alignContent: "flex-start"
                  }}
                >
                  {/* Industry Tags */}
                  {company.industry && company.industry.map((industry, index) => (
                    <div
                      key={`industry-${index}`}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#90EE90", // Light green based on your color scheme
                        color: "#000000",
                        borderRadius: "30px",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
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
                        padding: "8px 16px",
                        backgroundColor: "#D3D3D3", // Light gray based on your color scheme
                        color: "#000000",
                        borderRadius: "30px",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
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
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 0 20px"
          }}
        >
          {/* Navigation Arrows */}
          {companies.length > 1 && (
            <div style={{
              display: "flex",
              gap: "15px",
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
                  width: "45px",
                  height: "45px",
                  borderRadius: "50%",
                  backgroundColor: canNavigatePrev ? "#333" : "#222",
                  border: "none",
                  cursor: canNavigatePrev ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: canNavigatePrev ? "white" : "#555",
                  boxShadow: canNavigatePrev ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
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
                  width: "45px",
                  height: "45px",
                  borderRadius: "50%",
                  backgroundColor: canNavigateNext ? "#333" : "#222",
                  border: "none",
                  cursor: canNavigateNext ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: canNavigateNext ? "white" : "#555",
                  boxShadow: canNavigateNext ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
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
              gap: "8px",
              padding: "16px 24px",
              backgroundColor: "#F8D57E", // Yellow color from screenshot
              color: "#000000",
              border: "none",
              borderRadius: "30px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            ← Back to Directory
          </motion.button>
        </motion.section>


        {/* Add bottom padding */}
        <div style={{ height: "40px" }}></div>
      </motion.main>
    </motion.div>
  );
}

