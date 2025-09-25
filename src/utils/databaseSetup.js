// Database setup utility for Supabase
// Run this once to create the companies table in your Supabase project

import { supabase, COMPANIES_TABLE } from '../config/supabase';

// SQL for creating the companies table
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${COMPANIES_TABLE} (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  logo TEXT DEFAULT '',
  images JSONB DEFAULT '[]',
  header_image TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  detroit_story TEXT DEFAULT '',
  funding TEXT DEFAULT '',
  industry JSONB DEFAULT '[]',
  website TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on the name field for faster queries
CREATE INDEX IF NOT EXISTS idx_companies_name ON ${COMPANIES_TABLE}(name);

-- Create an index on industry for filtering
CREATE INDEX IF NOT EXISTS idx_companies_industry ON ${COMPANIES_TABLE} USING GIN(industry);

-- Enable Row Level Security (RLS)
ALTER TABLE ${COMPANIES_TABLE} ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON ${COMPANIES_TABLE}
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update/delete
-- Note: You may want to restrict this further in production
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON ${COMPANIES_TABLE}
  FOR ALL USING (auth.role() = 'authenticated');
`;

// Function to create the table structure
export const createCompaniesTable = async () => {
  try {
    console.log('Creating companies table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: CREATE_TABLE_SQL
    });

    if (error) {
      console.error('Error creating table:', error);
      // Try alternative approach using direct SQL execution
      console.log('Trying alternative approach...');
      
      // Create table using individual queries
      const queries = [
        `CREATE TABLE IF NOT EXISTS ${COMPANIES_TABLE} (
          id BIGSERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          logo TEXT DEFAULT '',
          images JSONB DEFAULT '[]',
          header_image TEXT DEFAULT '',
          tagline TEXT DEFAULT '',
          description TEXT DEFAULT '',
          detroit_story TEXT DEFAULT '',
          funding TEXT DEFAULT '',
          industry JSONB DEFAULT '[]',
          website TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        `CREATE INDEX IF NOT EXISTS idx_companies_name ON ${COMPANIES_TABLE}(name)`,
        `CREATE INDEX IF NOT EXISTS idx_companies_industry ON ${COMPANIES_TABLE} USING GIN(industry)`
      ];

      for (const query of queries) {
        const { error: queryError } = await supabase.rpc('exec_sql', { sql: query });
        if (queryError) {
          console.error('Error executing query:', query, queryError);
        }
      }
    }

    console.log('Companies table setup completed!');
    return true;
  } catch (error) {
    console.error('Failed to create companies table:', error);
    return false;
  }
};

// Function to check if table exists and has data
export const checkTableStatus = async () => {
  try {
    const { data, error, count } = await supabase
      .from(COMPANIES_TABLE)
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log('Table does not exist or is not accessible:', error.message);
      return { exists: false, count: 0 };
    }

    console.log('Table exists with', count, 'records');
    return { exists: true, count };
  } catch (error) {
    console.error('Error checking table status:', error);
    return { exists: false, count: 0 };
  }
};

// Function to setup the database (call this once)
export const setupDatabase = async () => {
  console.log('Setting up Supabase database...');
  
  const status = await checkTableStatus();
  
  if (!status.exists) {
    console.log('Table does not exist, creating...');
    await createCompaniesTable();
  } else {
    console.log('Table already exists!');
  }
  
  return await checkTableStatus();
};

// Manual SQL to run in Supabase SQL Editor (if the above functions don't work)
export const MANUAL_SETUP_SQL = `
-- Run this SQL in your Supabase SQL Editor if automatic setup fails

CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  logo TEXT DEFAULT '',
  images JSONB DEFAULT '[]',
  header_image TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  detroit_story TEXT DEFAULT '',
  funding TEXT DEFAULT '',
  industry JSONB DEFAULT '[]',
  website TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies USING GIN(industry);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON companies
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON companies
  FOR ALL USING (auth.role() = 'authenticated');
`;

console.log('Database setup utility loaded. To setup manually, copy and run MANUAL_SETUP_SQL in your Supabase SQL editor.');
