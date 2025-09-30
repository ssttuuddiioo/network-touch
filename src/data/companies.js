import { parseCSV } from '../utils/csvParser';
import { loadCompaniesFromStorage, hasAdminChanges, loadStakeholdersFromStorage } from '../utils/dataStorage';
import { isSupabaseConfigured } from '../config/supabase';
import { checkMigrationStatus } from '../utils/csvMigration';
import { getCachedData, cacheData, isOnline } from '../utils/cacheManager';

const COMPANIES_CACHE_KEY = 'allCompanies';
// Local stakeholders CSV served from /public (fallback only)
const STAKEHOLDERS_CSV_URL = '/stakeholders.csv';

// Helper: Normalize to app ID from name
const normalizeId = (name) => (name || '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

// Load stakeholders from Supabase, fallback to CSV if needed
async function loadStakeholders() {
  try {
    // Try Supabase first
    const sbStakeholders = await loadStakeholdersFromStorage();
    if (sbStakeholders && sbStakeholders.length > 0) {
      return sbStakeholders;
    }

    // Fallback to CSV
    const response = await fetch(STAKEHOLDERS_CSV_URL, { cache: 'no-store' });
    if (!response.ok) {
      console.warn('Failed to fetch stakeholders CSV:', response.status);
      return [];
    }
    const csvContent = await response.text();
    const parsed = parseCSV(csvContent);
    const withStakeholderTag = (parsed || []).map(c => ({
      ...c,
      id: c?.id || normalizeId(c?.name),
      industry: Array.from(new Set([...(c.industry || []), 'Stakeholder'])),
      tags: Array.from(new Set([...(c.tags || []), 'Stakeholder'])),
    }));
    console.log('Loaded stakeholders from CSV:', withStakeholderTag.length);
    return withStakeholderTag;
  } catch (err) {
    console.warn('Error loading stakeholders CSV:', err);
    return [];
  }
}

/**
 * Main function to load companies with a cache-first strategy.
 * It will immediately return cached data if available, and then
 * fetch fresh data in the background to update the cache.
 * @param {function} setData - The React state setter to update the component with data.
 */
export const loadCompaniesWithCache = (setData) => {
  // TEMP: Disable cache to always load fresh data from Supabase
  // const cachedCompanies = getCachedData(COMPANIES_CACHE_KEY);
  // if (cachedCompanies && cachedCompanies.length > 0) {
  //   setData(cachedCompanies);
  //   console.log('Loaded from cache:', cachedCompanies.length, 'companies');
  //   return;
  // }

  // Always load from Supabase or CSV (bypassing cache)
  Promise.all([
    loadCompaniesFromCSV(),
    loadStakeholders()
  ]).then(([companies, stakeholders]) => {
    // Merge by id, prefer primary companies data when duplicates exist
    const byId = new Map();
    for (const c of companies) byId.set(c.id, c);
    for (const s of stakeholders) if (!byId.has(s.id)) byId.set(s.id, s);
    const combined = Array.from(byId.values());

    // cacheData(COMPANIES_CACHE_KEY, combined); // Disabled caching (dev)
    setData(combined);
    console.log('Loaded from source + stakeholders:', companies.length, '+', stakeholders.length, '=', combined.length);
  }).catch(error => {
    console.error('Error loading companies with cache:', error);
    setData([]); // Set to empty array on error
  });
};

// Function to load companies - checks Supabase first, then admin changes, then CSV
export const loadCompaniesFromCSV = async () => {
  try {
    // If Supabase is configured, try to load from there first
    if (isSupabaseConfigured()) {
      console.log('Supabase configured, loading companies from database...');
      
      const supabaseCompanies = await loadCompaniesFromStorage();
      if (supabaseCompanies && supabaseCompanies.length > 0) {
        console.log('Successfully loaded', supabaseCompanies.length, 'companies from Supabase');
        return supabaseCompanies;
      } else {
        console.log('No companies found in Supabase, checking if migration is needed...');
        
        // Check if we need to migrate CSV data
        const status = await checkMigrationStatus();
        if (status.needsMigration) {
          console.log('Supabase table is empty, falling back to CSV data');
          console.log('Consider running the migration utility to populate Supabase');
        }
      }
    }
    
    // Fallback: Check if admin has made local changes
    if (hasAdminChanges()) {
      const adminCompanies = await loadCompaniesFromStorage();
      if (adminCompanies && adminCompanies.length > 0) {
        console.log('Loading companies from admin storage:', adminCompanies.length);
        return adminCompanies;
      }
    }
    
    // Final fallback: Load from CSV
    console.log('Loading companies from CSV...');
    const response = await fetch('/mc-network.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvContent = await response.text();
    console.log('CSV content loaded, length:', csvContent.length);
    
    // Parse the CSV data
    const parsedCompanies = parseCSV(csvContent);
    console.log('Parsed companies:', parsedCompanies.length);
    
    // Only return CSV companies if we have them
    if (parsedCompanies.length > 0) {
      console.log('Successfully loaded', parsedCompanies.length, 'companies from CSV');
      return parsedCompanies;
    } else {
      console.warn('No companies found in CSV');
      return [];
    }
  } catch (error) {
    console.error('Error loading company data:', error);
    
    // Emergency fallback: try to load from CSV even if other methods failed
    try {
      console.log('Attempting emergency CSV fallback...');
      const response = await fetch('/mc-network.csv');
      const csvContent = await response.text();
      const parsedCompanies = parseCSV(csvContent);
      console.log('Emergency fallback loaded', parsedCompanies.length, 'companies');
      return parsedCompanies;
    } catch (fallbackError) {
      console.error('Emergency fallback also failed:', fallbackError);
      return [];
    }
  }
};

// Start with empty array - components will load CSV data on mount
export const allCompanies = [];
