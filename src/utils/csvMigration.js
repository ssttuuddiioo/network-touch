// CSV Migration utility
// Migrates data from the CSV file to Supabase

import { parseCSV } from './csvParser';
import { saveCompaniesToStorage } from './dataStorage';
import { supabase, COMPANIES_TABLE, isSupabaseConfigured } from '../config/supabase';

// Function to migrate CSV data to Supabase
export const migrateCsvToSupabase = async () => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Please set up your Supabase credentials first.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    console.log('Starting CSV migration to Supabase...');
    
    // Step 1: Load and parse CSV data
    console.log('Loading CSV data...');
    const csvData = await fetch('/mc-network.csv');
    const csvText = await csvData.text();
    const companies = parseCSV(csvText);
    
    console.log('Parsed', companies.length, 'companies from CSV');

    // Step 2: Check if table already has data
    const { count } = await supabase
      .from(COMPANIES_TABLE)
      .select('id', { count: 'exact' })
      .limit(1);

    if (count > 0) {
      console.log('Table already has', count, 'records. Migration may overwrite existing data.');
    }

    // Step 3: Convert to Supabase format and save
    console.log('Converting data to Supabase format...');
    const supabaseCompanies = companies.map(company => ({
      id: company.id, // <-- THIS WAS THE MISSING PIECE
      name: company.name,
      logo: company.logo || '',
      images: company.images || [],
      header_image: company.headerImage || '',
      tagline: company.tagline || '',
      description: company.description || '',
      detroit_story: company.detroitStory || '',
      funding: company.funding || '',
      industry: company.industry || [],
      website: company.website || ''
    }));

    // Step 4: Batch insert to Supabase
    console.log('Inserting companies into Supabase...');
    const batchSize = 100; // Insert in batches to avoid timeout
    let totalInserted = 0;
    
    for (let i = 0; i < supabaseCompanies.length; i += batchSize) {
      const batch = supabaseCompanies.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from(COMPANIES_TABLE)
        .upsert(batch, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('Error inserting batch:', error);
        return { 
          success: false, 
          error: error.message,
          inserted: totalInserted 
        };
      }

      totalInserted += data.length;
      console.log('Inserted batch', Math.floor(i / batchSize) + 1, '- Total:', totalInserted);
    }

    console.log('Migration completed! Inserted', totalInserted, 'companies.');
    
    return { 
      success: true, 
      inserted: totalInserted,
      total: companies.length 
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Function to export Supabase data back to CSV
export const exportSupabaseToCSV = async () => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured.');
    return null;
  }

  try {
    console.log('Exporting Supabase data to CSV...');
    
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      return null;
    }

    // Convert back to CSV format
    const csvHeader = "Company Name,Logo URL,Photo URL,Header Image URL,Tagline,Description,Detroit's story,Funding Stage,Industry,Industry 2,Industry 3,Website URL";
    
    const csvRows = data.map(company => {
      const industries = company.industry || [];
      const images = company.images || [];
      
      return [
        company.name || '',
        company.logo || '',
        images[0] || '',
        company.header_image || '',
        company.tagline || '',
        company.description || '',
        company.detroit_story || '',
        company.funding || '',
        industries[0] || '',
        industries[1] || '',
        industries[2] || '',
        company.website || ''
      ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [csvHeader].concat(csvRows).join('\n');
    
    console.log('Exported', data.length, 'companies to CSV format');
    return csvContent;

  } catch (error) {
    console.error('Export failed:', error);
    return null;
  }
};

// Function to clear all data and re-import from CSV
export const resetToCSV = async () => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    console.log('Resetting database to CSV data...');
    
    // Step 1: Clear all existing data
    console.log('Clearing existing data...');
    const { error: deleteError } = await supabase
      .from(COMPANIES_TABLE)
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      console.error('Error clearing data:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // Step 2: Re-import from CSV
    const result = await migrateCsvToSupabase();
    
    if (result.success) {
      console.log('Database reset completed!');
    }
    
    return result;

  } catch (error) {
    console.error('Reset failed:', error);
    return { success: false, error: error.message };
  }
};

// Utility to check migration status
export const checkMigrationStatus = async () => {
  if (!isSupabaseConfigured()) {
    return { configured: false };
  }

  try {
    // Check CSV data
    const csvData = await fetch('/mc-network.csv');
    const csvText = await csvData.text();
    const csvCompanies = parseCSV(csvText);

    // Check Supabase data
    const { data, error, count } = await supabase
      .from(COMPANIES_TABLE)
      .select('name', { count: 'exact' })
      .limit(1);

    if (error) {
      return {
        configured: true,
        tableExists: false,
        csvCount: csvCompanies.length,
        supabaseCount: 0,
        needsMigration: true
      };
    }

    return {
      configured: true,
      tableExists: true,
      csvCount: csvCompanies.length,
      supabaseCount: count,
      needsMigration: count === 0,
      isInSync: count === csvCompanies.length
    };

  } catch (error) {
    console.error('Error checking migration status:', error);
    return { configured: true, error: error.message };
  }
};
