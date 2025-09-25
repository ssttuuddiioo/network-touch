import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { parseCSV } from "../utils/csvParser";
import { getEmojiPlaceholder, isValidLogoUrl } from "../utils/emojiPlaceholders";
import { parseBulkCompanyText, getBulkImportSample } from "../utils/bulkParser";
import CompanyImage from './CompanyImage';
import { 
  saveCompaniesToStorage, 
  loadCompaniesFromStorage, 
  hasAdminChanges,
  clearAdminChanges,
  saveCompanyToSupabase,
  deleteCompanyFromStorage
} from "../utils/dataStorage";
import { isSupabaseConfigured } from "../config/supabase";
import { 
  migrateCsvToSupabase, 
  checkMigrationStatus, 
  exportSupabaseToCSV,
  resetToCSV 
} from "../utils/csvMigration";

const ADMIN_PASSWORD = "admin";

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [companies, setCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [operationStatus, setOperationStatus] = useState("");

  // Check authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem("adminAuth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      loadCompanies();
      checkSupabaseMigration();
    }
  }, []);

  // Check Supabase migration status
  const checkSupabaseMigration = async () => {
    if (isSupabaseConfigured()) {
      try {
        const status = await checkMigrationStatus();
        setMigrationStatus(status);
      } catch (error) {
        console.error('Error checking migration status:', error);
      }
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuth", "true");
      loadCompanies();
    } else {
      alert("Invalid password");
    }
  };

  const loadCompanies = async () => {
    setLoading(true);
    setOperationStatus("Loading companies...");
    try {
      // Try to load from Supabase first (if configured)
      if (isSupabaseConfigured()) {
        const supabaseCompanies = await loadCompaniesFromStorage();
        if (supabaseCompanies && supabaseCompanies.length > 0) {
          setCompanies(supabaseCompanies);
          setOperationStatus(`Loaded ${supabaseCompanies.length} companies from Supabase`);
          setLoading(false);
          return;
        }
      }
      
      // Fallback: try to load from localStorage admin storage
      if (hasAdminChanges()) {
        const storedCompanies = await loadCompaniesFromStorage();
        if (storedCompanies && storedCompanies.length > 0) {
          setCompanies(storedCompanies);
          setOperationStatus(`Loaded ${storedCompanies.length} companies from local storage`);
          setLoading(false);
          return;
        }
      }
      
      // Final fallback: load from CSV
      setOperationStatus("Loading from CSV...");
      const response = await fetch("/mc-network.csv");
      const csvContent = await response.text();
      const parsedCompanies = parseCSV(csvContent);
      setCompanies(parsedCompanies);
      setOperationStatus(`Loaded ${parsedCompanies.length} companies from CSV`);
    } catch (error) {
      console.error("Failed to load companies:", error);
      setOperationStatus("Failed to load companies");
      alert("Failed to load companies. Please check if the CSV file exists.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("adminAuth");
    setPassword("");
  };

  const handleDeleteCompany = async (companyId) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
      setOperationStatus(`Deleting ${company.name}...`);
      
      try {
        // If using Supabase, delete from database
        if (isSupabaseConfigured()) {
          const success = await deleteCompanyFromStorage(company.name);
          if (!success) {
            alert("Failed to delete company from database");
            return;
          }
        }
        
        // Update local state
        const updatedCompanies = companies.filter(c => c.id !== companyId);
        setCompanies(updatedCompanies);
        
        // Save to storage (localStorage fallback or bulk update)
        if (!isSupabaseConfigured()) {
          await saveCompaniesToStorage(updatedCompanies);
        }
        
        setOperationStatus(`Deleted ${company.name} successfully`);
      } catch (error) {
        console.error("Error deleting company:", error);
        setOperationStatus("Failed to delete company");
        alert("Failed to delete company");
      }
    }
  };

  const handleEditCompany = (company) => {
    setEditingCompany({ ...company });
  };

  const handleAddNew = () => {
    setEditingCompany({
      name: '',
      tagline: '',
      description: '',
      logo: '',
      headerImage: '',
      qrCode: '',
      website: '',
      // funding: '',
      industry: [],
      modifiers: [],
      newlabRelationship: '',
      // newlabLocation: '',
      detroitStory: '',
      images: []
    });
    setShowAddForm(true);
  };

  const handleSaveCompany = async () => {
    if (!editingCompany.name.trim()) {
      alert("Company name is required");
      return;
    }

    setOperationStatus(`Saving ${editingCompany.name}...`);

    try {
      let updatedCompany = editingCompany;
      
      if (!editingCompany.id) {
        // Add new company
        updatedCompany = {
          ...editingCompany,
          id: editingCompany.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
          employees: '1-10',
          location: 'Detroit, MI',
          founded: new Date().getFullYear().toString(),
          tags: editingCompany.industry.concat(['Detroit', 'Startup'])
        };
      }

      // If using Supabase, save individual company
      if (isSupabaseConfigured()) {
        const result = await saveCompanyToSupabase(updatedCompany);
        if (!result) {
          alert("Failed to save company to database");
          setOperationStatus("Save failed");
          return;
        }
        // Use the returned data from Supabase (includes generated ID)
        updatedCompany = result.id ? result : updatedCompany;
      }

      // Update local state
      let updatedCompanies;
      if (editingCompany.id) {
        // Update existing
        updatedCompanies = companies.map(c => 
          c.id === editingCompany.id ? updatedCompany : c
        );
      } else {
        // Add new
        updatedCompanies = companies.concat([updatedCompany]);
      }
      
      setCompanies(updatedCompanies);
      
      // Save to storage (localStorage fallback or bulk update)
      if (!isSupabaseConfigured()) {
        await saveCompaniesToStorage(updatedCompanies);
      }
      
      setEditingCompany(null);
      setShowAddForm(false);
      setOperationStatus(`Saved ${updatedCompany.name} successfully`);
    } catch (error) {
      console.error("Error saving company:", error);
      setOperationStatus("Failed to save company");
      alert("Failed to save company");
    }
  };

  const exportCSV = async () => {
    setOperationStatus("Exporting CSV...");
    
    try {
      let csvContent;
      
      // If using Supabase, export from database
      if (isSupabaseConfigured()) {
        csvContent = await exportSupabaseToCSV();
        if (!csvContent) {
          // Fallback to local data
          csvContent = exportLocalCSV();
        }
      } else {
        csvContent = exportLocalCSV();
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mc-network-updated.csv';
      a.click();
      URL.revokeObjectURL(url);
      
      setOperationStatus("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setOperationStatus("Failed to export CSV");
      alert("Failed to export CSV");
    }
  };

  const exportLocalCSV = () => {
    // Convert local companies back to CSV format
    const csvHeader = "Company Name,Logo URL,Header Image URL,QR Code URL,Photo URL,Tagline,Description,Funding Stage,Industry,Industry 2,Industry 3,Modifiers,Newlab Relationship,Newlab Location,Website URL";
    const csvRows = companies.map(company => {
      return [
        company.name,
        company.logo || '',
        company.headerImage || '',
        company.qrCode || '',
        (company.images && company.images[0]) || '',
        company.tagline || '',
        company.description || '',
        // company.funding || '',
        (company.industry && company.industry[0]) || '',
        (company.industry && company.industry[1]) || '',
        (company.industry && company.industry[2]) || '',
        (company.modifiers && company.modifiers.join(', ')) || '',
        company.newlabRelationship || '',
        // company.newlabLocation || '',
        company.website || ''
      ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',');
    });
    
    return [csvHeader].concat(csvRows).join('\n');
  };

  const resetToOriginalCSV = async () => {
    if (window.confirm("This will remove all admin changes and reload from the original CSV. Are you sure?")) {
      setOperationStatus("Resetting to original CSV...");
      
      try {
        if (isSupabaseConfigured()) {
          const result = await resetToCSV();
          if (result.success) {
            setOperationStatus(`Reset completed. Imported ${result.inserted} companies from CSV.`);
          } else {
            setOperationStatus("Reset failed");
            alert("Failed to reset database: " + result.error);
            return;
          }
        } else {
          await clearAdminChanges();
        }
        
        await loadCompanies();
        await checkSupabaseMigration(); // Re-check status after reset
      } catch (error) {
        console.error("Error resetting to CSV:", error);
        setOperationStatus("Reset failed");
        alert("Failed to reset to CSV");
      }
    }
  };

  // New function: Migrate CSV to Supabase
  const handleMigration = async () => {
    if (!isSupabaseConfigured()) {
      alert("Supabase is not configured. Please set up your Supabase credentials first.");
      return;
    }

    if (window.confirm("This will import all CSV data into Supabase. Existing data may be overwritten. Continue?")) {
      setOperationStatus("Migrating CSV to Supabase...");
      
      try {
        const result = await migrateCsvToSupabase();
        if (result.success) {
          setOperationStatus(`Migration completed! Imported ${result.inserted} companies.`);
          await loadCompanies();
          await checkSupabaseMigration();
        } else {
          setOperationStatus("Migration failed");
          alert("Migration failed: " + result.error);
        }
      } catch (error) {
        console.error("Migration error:", error);
        setOperationStatus("Migration failed");
        alert("Migration failed");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px var(--shadow)',
            minWidth: '300px',
            textAlign: 'center'
          }}
        >
          <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Admin Panel</h2>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          <button 
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#FAC853',
              color: 'black',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Supabase Status */}
        {isSupabaseConfigured() && migrationStatus && (
          <div style={{
            backgroundColor: migrationStatus.needsMigration ? '#fff3cd' : '#d4edda',
            border: `1px solid ${migrationStatus.needsMigration ? '#ffeaa7' : '#c3e6cb'}`,
            color: migrationStatus.needsMigration ? '#856404' : '#155724',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
              🗄️ Supabase Status
            </h3>
            <p style={{ margin: '5px 0' }}>
              CSV: {migrationStatus.csvCount} companies | 
              Database: {migrationStatus.supabaseCount} companies
            </p>
            {migrationStatus.needsMigration && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ margin: '5px 0' }}>⚠️ Database is empty. Migration recommended.</p>
                <button 
                  onClick={handleMigration}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '5px'
                  }}
                >
                  Migrate CSV to Supabase
                </button>
              </div>
            )}
            {migrationStatus.isInSync && (
              <p style={{ margin: '5px 0', color: '#155724' }}><span role="img" aria-label="check mark">✅</span> Database is in sync with CSV</p>
            )}
          </div>
        )}

        {/* Operation Status */}
        {operationStatus && (
          <div style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #bbdefb',
            color: '#0d47a1',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {operationStatus}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>
            Company Admin Panel
            {isSupabaseConfigured() && (
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                {' '}(Supabase Enabled)
              </span>
            )}
          </h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={handleAddNew}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Company
            </button>
            <button 
              onClick={exportCSV}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Export CSV
            </button>
            {hasAdminChanges() && (
              <button 
                onClick={resetToOriginalCSV}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Reset to CSV
              </button>
            )}
            <button 
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading companies...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
              Total Companies: {companies.length}
            </div>

            {/* Companies List */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              {companies.map(company => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px var(--shadow)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        marginRight: '15px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}
                    >
                        <CompanyImage 
                            company={company}
                            style={{ 
                                width: '80%', 
                                height: '80%', 
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: 'var(--text-primary)', fontWeight: '600' }}>{company.name}</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                        {company.tagline}
                      </p>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {(company.industry && company.industry.join(', ')) || 'No industry'} • {company.funding}
                  </p>
                  
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px', lineHeight: '1.4' }}>
                    {(company.description && company.description.slice(0, 100)) || 'No description'}...
                  </p>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleEditCompany(company)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#FAC853',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCompany(company.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Edit/Add Form Modal */}
        {(editingCompany || showAddForm) && (
          <CompanyForm 
            company={editingCompany || {}}
            onSave={handleSaveCompany}
            onCancel={() => {
              setEditingCompany(null);
              setShowAddForm(false);
            }}
            onChange={setEditingCompany}
          />
        )}
      </div>
    </div>
  );
}

// Company Form Component
function CompanyForm({ company, onSave, onCancel, onChange }) {
  const [bulkText, setBulkText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    
    const parsedData = parseBulkCompanyText(bulkText);
    
    // Merge with existing company data, preserving logo, headerImage, and qrCode
    const updatedCompany = {
      ...company,
      ...parsedData,
      // Always preserve the photo/media fields
      logo: company.logo || '',
      headerImage: company.headerImage || '',
      qrCode: company.qrCode || ''
    };
    
    onChange(updatedCompany);
    setBulkText('');
    setShowBulkImport(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
        backdropFilter: 'blur(8px)'
      }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 12px 48px var(--shadow)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto'
        }}
      >
        <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '24px', fontWeight: '600' }}>
          {company.id ? 'Edit Company' : 'Add New Company'}
        </h2>

        {/* Bulk Import Section */}
        <div style={{ 
          marginBottom: '25px', 
          padding: '20px', 
          backgroundColor: 'var(--bg-tertiary)', 
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ 
              margin: 0, 
              color: 'var(--text-primary)', 
              fontSize: '16px', 
              fontWeight: '600' 
            }}>
              <span role="img" aria-label="rocket">🚀</span> Bulk Import
            </h3>
            <button
              type="button"
              onClick={() => setShowBulkImport(!showBulkImport)}
              style={{
                padding: '8px 16px',
                backgroundColor: showBulkImport ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: showBulkImport ? 'var(--bg-primary)' : 'var(--text-primary)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {showBulkImport ? 'Hide' : 'Show'} Bulk Import
            </button>
          </div>
          
          {showBulkImport && (
            <>
              <p style={{ 
                margin: '0 0 15px 0', 
                color: 'var(--text-secondary)', 
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                Paste structured company data below. This will auto-fill the form fields while preserving your logo, header image, and QR code URLs.
              </p>
              
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={getBulkImportSample()}
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: 'monospace',
                  lineHeight: '1.4',
                  resize: 'vertical'
                }}
              />
              
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={!bulkText.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: bulkText.trim() ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: bulkText.trim() ? 'var(--bg-primary)' : 'var(--text-muted)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: '8px',
                    cursor: bulkText.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <span role="img" aria-label="inbox">📥</span> Import Data
                </button>
                
                <button
                  type="button"
                  onClick={() => setBulkText('')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Company Name *
          </label>
          <input
            type="text"
            value={company.name || ''}
            onChange={(e) => onChange({...company, name: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="Enter company name"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Tagline
          </label>
          <input
            type="text"
            value={company.tagline || ''}
            onChange={(e) => onChange({...company, tagline: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="Short description of what the company does"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Description
          </label>
          <textarea
            value={company.description || ''}
            onChange={(e) => onChange({...company, description: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              height: '100px',
              fontSize: '14px',
              resize: 'vertical',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            placeholder="Detailed description of the company"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Logo URL
          </label>
          <input
            type="url"
            value={company.logo || ''}
            onChange={(e) => onChange({...company, logo: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Header Image URL
          </label>
          <input
            type="url"
            value={company.headerImage || ''}
            onChange={(e) => onChange({...company, headerImage: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="https://example.com/header-image.jpg"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            QR Code URL
          </label>
          <input
            type="url"
            value={company.qrCode || ''}
            onChange={(e) => onChange({...company, qrCode: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="https://example.com/qr-code.png"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Website URL
          </label>
          <input
            type="url"
            value={company.website || ''}
            onChange={(e) => onChange({...company, website: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="https://company-website.com"
          />
        </div>

        {/*
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Funding Stage
          </label>
          <select
            value={company.funding || ''}
            onChange={(e) => onChange({...company, funding: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          >
            <option value="">Select funding stage</option>
            <option value="Formation (Idea to Pre-seed)">Formation (Idea to Pre-seed)</option>
            <option value="Early (Seed to A)">Early (Seed to A)</option>
            <option value="Scale (B+)">Scale (B+)</option>
          </select>
        </div>
        */}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Industries (comma-separated)
          </label>
          <input
            type="text"
            value={company.industry ? company.industry.join(', ') : ''}
            onChange={(e) => onChange({
              ...company, 
              industry: e.target.value.split(',').map(s => s.trim()).filter(s => s)
            })}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="e.g. Technology, Manufacturing, AI"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Modifiers (Focus Areas)
          </label>
          <input
            type="text"
            value={company.modifiers ? company.modifiers.join(', ') : ''}
            onChange={(e) => onChange({
              ...company, 
              modifiers: e.target.value.split(',').map(s => s.trim()).filter(s => s)
            })}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="e.g. Climate, Innovation, Sustainability"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Newlab Relationship
          </label>
          <select
            value={company.newlabRelationship || ''}
            onChange={(e) => onChange({...company, newlabRelationship: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          >
            <option value="">Select relationship...</option>
            <option value="Resident">Resident</option>
            <option value="Portfolio">Portfolio</option>
            <option value="Partner">Partner</option>
            <option value="Alumni">Alumni</option>
          </select>
        </div>

        {/*
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>
            Newlab Location
          </label>
          <select
            value={company.newlabLocation || ''}
            onChange={(e) => onChange({...company, newlabLocation: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          >
            <option value="">Select location...</option>
            <option value="Detroit">Detroit</option>
            <option value="Brooklyn">Brooklyn</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
        */}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
