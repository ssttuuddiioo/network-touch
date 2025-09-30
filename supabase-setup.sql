DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS stakeholders;

-- Create the companies table
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
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

-- Create the stakeholders table (matches companies shape with Stakeholder-specific tagging handled in app)
CREATE TABLE stakeholders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT DEFAULT '',
  images JSONB DEFAULT '[]',
  header_image TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  detroit_story TEXT DEFAULT '',
  funding TEXT DEFAULT '',
  industry JSONB DEFAULT '[]',
  website TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for stakeholders
CREATE INDEX IF NOT EXISTS idx_stakeholders_name ON stakeholders(name);
CREATE INDEX IF NOT EXISTS idx_stakeholders_industry ON stakeholders USING GIN(industry);
CREATE INDEX IF NOT EXISTS idx_stakeholders_tags ON stakeholders USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
