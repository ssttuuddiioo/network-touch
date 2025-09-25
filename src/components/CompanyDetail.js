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
        backgroundColor: "var(--bg-primary)",
        position: "relative"
      }}
    >
      {/* Header with Back Button */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "var(--glass)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          padding: "16px 20px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}
      >
        <motion.button
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "var(--accent-primary)",
            color: "var(--bg-primary)",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600"
          }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back to Grid
        </motion.button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: "24px", 
            color: "var(--text-primary)",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: "bold"
          }}>
{company && company.name}
          </h1>
          
          {/* Company Counter */}
          {companies.length > 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                padding: "4px 12px",
                backgroundColor: "var(--accent-primary)",
                color: "var(--bg-primary)",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              {currentIndex + 1} of {companies.length}
            </motion.div>
          )}
        </div>
      </motion.header>


      {/* Navigation Arrows */}
      {companies.length > 1 && (
        <>
          {/* Previous Company Arrow */}
          <motion.button
            onClick={handlePrevCompany}
            disabled={!canNavigatePrev}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: canNavigatePrev ? 1 : 0.3, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={canNavigatePrev ? { scale: 1.1, x: -5 } : {}}
            whileTap={canNavigatePrev ? { scale: 0.95 } : {}}
            style={{
              position: "fixed",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: canNavigatePrev ? "var(--bg-card)" : "var(--bg-secondary)",
              border: "2px solid var(--border)",
              cursor: canNavigatePrev ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: canNavigatePrev ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: "0 8px 32px var(--shadow)",
              backdropFilter: "blur(20px)",
              zIndex: 1000,
              transition: "all 0.3s ease"
            }}
          >
            ←
          </motion.button>

          {/* Next Company Arrow */}
          <motion.button
            onClick={handleNextCompany}
            disabled={!canNavigateNext}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: canNavigateNext ? 1 : 0.3, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={canNavigateNext ? { scale: 1.1, x: 5 } : {}}
            whileTap={canNavigateNext ? { scale: 0.95 } : {}}
            style={{
              position: "fixed",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: canNavigateNext ? "var(--bg-card)" : "var(--bg-secondary)",
              border: "2px solid var(--border)",
              cursor: canNavigateNext ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: canNavigateNext ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: "0 8px 32px var(--shadow)",
              backdropFilter: "blur(20px)",
              zIndex: 1000,
              transition: "all 0.3s ease"
            }}
          >
            →
          </motion.button>
        </>
      )}

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
        style={{ padding: "0", maxWidth: "800px", margin: "0 auto" }}
      >
        
        {/* Header Section with Logo and Name */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            padding: "150px 20px 30px",
            marginBottom: "0"
          }}
        >
          <motion.div
            layoutId={`company-${company.id}`}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
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
          
          <h2 style={{ 
            margin: "0", 
            fontSize: "48px", 
            color: "var(--text-primary)",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: "600"
          }}>
            {company.name}
          </h2>
        </motion.section>

        {/* Large Photo Section - Between Title and Description */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            margin: "0 20px 40px",
            borderRadius: "24px",
            overflow: "hidden",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            height: "400px",
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
                objectFit: "cover"
              }}
           />
        </motion.section>

        {/* Description Card */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            margin: "0 20px 40px",
            padding: "40px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "24px",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px var(--shadow)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Colored accent line */}
          <div style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "linear-gradient(90deg, #FAC853 0%, #4ECDC4 100%)"
          }} />
          
          <h3 style={{
            fontSize: "32px",
            fontWeight: "600",
            color: "var(--text-primary)",
            marginBottom: "24px",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
          }}>
            Description
          </h3>
          
          <p style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            lineHeight: "1.6",
            margin: "0",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
          }}>
            {company.description}
          </p>
        </motion.section>

        {/* Tags and Funding Section */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            margin: "0 20px 40px",
            display: "grid",
            gridTemplateColumns: "65% auto",
            gap: "20px",
            alignItems: "stretch"
          }}
        >
          {/* Funding Stage Card - HIDDEN
          <div style={{
            padding: "32px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "24px",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px var(--shadow)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              height: "4px",
              backgroundColor: "#FAC853"
            }} />
            
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "16px",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
            }}>
              Funding Stage
            </h4>
            <p style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "var(--text-primary)",
              margin: "0",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
            }}>
              {company.funding || "Early (Seed to A)"}
            </p>
          </div>
          */}

          {/* Newlab Relationship Card */}
          <div style={{
            padding: "32px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "24px",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px var(--shadow)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Teal accent line */}
            <div style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              height: "4px",
              backgroundColor: "#4ECDC4"
            }} />
            
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "16px",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
            }}>
              Newlab Relationship
            </h4>
            <p style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "var(--text-primary)",
              margin: "0",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
            }}>
              {company.newlabRelationship || "Resident"}
            </p>
          </div>

          {/* QR Code Card */}
          <div style={{
            padding: "32px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "24px",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px var(--shadow)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "160px",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Purple accent line */}
            <div style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              height: "4px",
              backgroundColor: "#8B5CF6"
            }} />
            
            <p style={{
              color: "var(--text-muted)",
              fontSize: "12px",
              textAlign: "center",
              margin: "0",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              marginBottom: "16px"
            }}>
              Company website
            </p>
            <CompanyQRCode companyId={company.id} size={128} />
          </div>
        </motion.section>

        {/* Industry Tags */}
        {((company.industry && company.industry.length > 0) || (company.modifiers && company.modifiers.length > 0)) && (
          <motion.section
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              margin: "0 20px 40px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >
            {/* Industry Tags */}
            {company.industry && company.industry.map((industry, index) => (
              <div
                key={`industry-${index}`}
                style={{
                  padding: "16px 24px",
                  backgroundColor: "#90EE90", // Light green based on your color scheme
                  color: "#000000",
                  borderRadius: "24px",
                  fontSize: "16px",
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
                  padding: "16px 24px",
                  backgroundColor: "#D3D3D3", // Light gray based on your color scheme
                  color: "#000000",
                  borderRadius: "24px",
                  fontSize: "16px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
                }}
              >
                {modifier}
              </div>
            ))}
          </motion.section>
        )}


        {/* Bottom Section - QR Code and Location - NOW EMPTY */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            margin: "0 20px 160px",
            display: "grid",
            gridTemplateColumns: "auto",
            gap: "20px"
          }}
        >
          {/* QR Code Card - MOVED */}

          {/* Newlab Location Card - HIDDEN
          <div style={{
            padding: "40px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "24px",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px var(--shadow)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              height: "4px",
              backgroundColor: "#10B981"
            }} />
            
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "16px",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
            }}>
              Newlab Location
            </h4>
            <h3 style={{
              fontSize: "48px",
              fontWeight: "600",
              color: "var(--text-primary)",
              margin: "0",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
            }}>
              {company.newlabLocation || "Newlab Location"}
            </h3>
            
            <div 
              onClick={handleExploreLocation}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                backgroundColor: "#10B981",
                borderRadius: "20px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                alignSelf: "flex-start",
                cursor: "pointer",
                transition: "all 0.3s ease",
                userSelect: "none"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#059669";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#10B981";
                e.target.style.transform = "scale(1)";
              }}
            >
              <span style={{
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
              }}>
                EXPLORE OTHERS AT THIS LOCATION
              </span>
              <span style={{
                color: "white",
                fontSize: "16px"
              }}>
                →
              </span>
            </div>
          </div>
            */}
        </motion.section>
      </motion.main>
    </motion.div>
  );
}

