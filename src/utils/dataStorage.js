// Centralized data storage for company information
// Uses Supabase for persistent cloud storage with real-time updates

import { supabase, COMPANIES_TABLE, isSupabaseConfigured } from '../config/supabase';

// Fallback to localStorage if Supabase is not configured
const STORAGE_KEY = 'admin_companies';
const VERSION_KEY = 'admin_data_version';

// Save a single company to Supabase
export const saveCompanyToSupabase = async (company) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, falling back to localStorage');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .upsert([{
        name: company.name,
        logo: company.logo || '',
        images: company.images || [],
        header_image: company.headerImage || '',
        tagline: company.tagline || '',
        description: company.description || '',
        detroit_story: company.detroitStory || '',
        funding: company.funding || '',
        industry: company.industry || [],
        website: company.website || '',
        created_at: company.id ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'name'
      })
      .select();

    if (error) {
      console.error('Error saving company to Supabase:', error);
      return false;
    }

    console.log('Successfully saved company to Supabase:', company.name);
    return data[0];
  } catch (error) {
    console.error('Failed to save company to Supabase:', error);
    return false;
  }
};

// Save all companies to Supabase (bulk operation)
export const saveCompaniesToStorage = async (companies) => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    return saveCompaniesToLocalStorage(companies);
  }

  try {
    // Convert companies to Supabase format
    const supabaseCompanies = companies.map(company => ({
      name: company.name,
      logo: company.logo || '',
      images: company.images || [],
      header_image: company.headerImage || '',
      tagline: company.tagline || '',
      description: company.description || '',
      detroit_story: company.detroitStory || '',
      funding: company.funding || '',
      industry: company.industry || [],
      website: company.website || '',
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .upsert(supabaseCompanies, {
        onConflict: 'name'
      })
      .select();

    if (error) {
      console.error('Error saving companies to Supabase:', error);
      return false;
    }

    console.log('Successfully saved', companies.length, 'companies to Supabase');
    
    // Trigger custom event for real-time updates
    window.dispatchEvent(new CustomEvent('supabase-data-change', {
      detail: { type: 'bulk-update', companies: data }
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to save companies to Supabase:', error);
    return false;
  }
};

// localStorage fallback function
const saveCompaniesToLocalStorage = (companies) => {
  try {
    const dataToSave = {
      companies: companies,
      timestamp: Date.now(),
      version: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    localStorage.setItem(VERSION_KEY, dataToSave.version.toString());
    
    console.log('Saved', companies.length, 'companies to localStorage (fallback)');
    
    // Trigger storage event for other tabs/windows
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(dataToSave),
      storageArea: localStorage
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to save companies to localStorage:', error);
    return false;
  }
};

// Load companies from Supabase
export const loadCompaniesFromStorage = async () => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    return loadCompaniesFromLocalStorage();
  }

  try {
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading companies from Supabase:', error);
      // Fallback to localStorage
      return loadCompaniesFromLocalStorage();
    }

    // Convert Supabase format back to app format
    const companies = data.map(company => ({
      id: company.id || company.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      name: company.name,
      logo: company.logo,
      images: company.images || [],
      headerImage: company.header_image,
      tagline: company.tagline,
      description: company.description,
      detroitStory: company.detroit_story,
      funding: company.funding,
      industry: company.industry || [],
      website: company.website
    }));

    console.log('Loaded', companies.length, 'companies from Supabase');
    return companies;
  } catch (error) {
    console.error('Failed to load companies from Supabase:', error);
    // Fallback to localStorage
    return loadCompaniesFromLocalStorage();
  }
};

// localStorage fallback function
const loadCompaniesFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const data = JSON.parse(stored);
    console.log('Loaded', data.companies.length, 'companies from localStorage (fallback)');
    return data.companies;
  } catch (error) {
    console.error('Failed to load companies from localStorage:', error);
    return null;
  }
};

// Delete a company from Supabase
export const deleteCompanyFromStorage = async (companyName) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot delete from database');
    return false;
  }

  try {
    const { error } = await supabase
      .from(COMPANIES_TABLE)
      .delete()
      .eq('name', companyName);

    if (error) {
      console.error('Error deleting company from Supabase:', error);
      return false;
    }

    console.log('Successfully deleted company from Supabase:', companyName);
    
    // Trigger custom event for real-time updates
    window.dispatchEvent(new CustomEvent('supabase-data-change', {
      detail: { type: 'delete', companyName }
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to delete company from Supabase:', error);
    return false;
  }
};

// Check if admin has made changes (for Supabase, always return false since data is live)
export const hasAdminChanges = () => {
  if (isSupabaseConfigured()) {
    return false; // With Supabase, changes are automatically saved
  }
  return localStorage.getItem(STORAGE_KEY) !== null;
};

// Clear admin changes and revert to CSV
export const clearAdminChanges = async () => {
  if (isSupabaseConfigured()) {
    // For Supabase, we need to clear all data and re-import from CSV
    try {
      const { error } = await supabase
        .from(COMPANIES_TABLE)
        .delete()
        .neq('id', 0); // Delete all records

      if (error) {
        console.error('Error clearing companies from Supabase:', error);
        return false;
      }

      console.log('Cleared all companies from Supabase');
      
      // Trigger custom event for real-time updates
      window.dispatchEvent(new CustomEvent('supabase-data-change', {
        detail: { type: 'clear' }
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to clear companies from Supabase:', error);
      return false;
    }
  } else {
    // Fallback to localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VERSION_KEY);
      
      // Trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: null,
        storageArea: localStorage
      }));
      
      console.log('Cleared admin changes from localStorage');
      return true;
    } catch (error) {
      console.error('Failed to clear admin changes:', error);
      return false;
    }
  }
};

// Get current data version (for checking if data has changed)
export const getDataVersion = () => {
  if (isSupabaseConfigured()) {
    return Date.now().toString(); // For Supabase, always return current time
  }
  return localStorage.getItem(VERSION_KEY);
};

// Subscribe to data changes (for real-time updates)
export const subscribeToDataChanges = (callback) => {
  if (isSupabaseConfigured()) {
    // Subscribe to Supabase real-time changes
    const subscription = supabase
      .channel('companies_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: COMPANIES_TABLE
      }, (payload) => {
        console.log('Supabase real-time change:', payload);
        callback();
      })
      .subscribe();

    // Also listen for custom events (for immediate updates)
    const handleCustomChange = (event) => {
      callback();
    };
    
    window.addEventListener('supabase-data-change', handleCustomChange);
    
    // Return cleanup function
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('supabase-data-change', handleCustomChange);
    };
  } else {
    // Fallback to localStorage events
    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY) {
        callback();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};
