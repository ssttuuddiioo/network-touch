// Utility to parse bulk company text into structured data
export const parseBulkCompanyText = (text) => {
  if (!text || typeof text !== 'string') {
    return {};
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const company = {};
  
  // Extract company name (first line)
  if (lines.length > 0) {
    company.name = lines[0];
  }

  // Parse each section
  let currentSection = null;
  let collectingData = false;
  let multilineValue = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a section header
    if (isValidSectionHeader(line)) {
      // Save previous section if we were collecting data
      if (currentSection && multilineValue.length > 0) {
        const value = multilineValue.join(' ').trim();
        setCompanyField(company, currentSection, value);
        multilineValue = [];
      }
      
      currentSection = line;
      collectingData = true;
      continue;
    }

    // If we're in a section and this looks like content, collect it
    if (collectingData && currentSection) {
      // Skip empty lines and apparent subsection headers
      if (line && !isSubsectionHeader(line)) {
        multilineValue.push(line);
      }
    }
  }

  // Handle the last section
  if (currentSection && multilineValue.length > 0) {
    const value = multilineValue.join(' ').trim();
    setCompanyField(company, currentSection, value);
  }

  return company;
};

// Check if a line is a valid section header we care about
const isValidSectionHeader = (line) => {
  const headers = [
    'Description',
    'Funding Stage', 
    'Industry',
    'Modifiers',
    'Newlab Relationship',
    'Membership Status',
    'Newlab Location(s)',
    'Newlab Location',
    'Founded',
    'Team Size',
    'Employees',
    'Location',
    'Website',
    'Learn More',
    'Tagline'
  ];
  
  return headers.some(header => 
    line.toLowerCase().includes(header.toLowerCase()) ||
    line === header
  );
};

// Check if a line is a subsection header (like "Startup Details")
const isSubsectionHeader = (line) => {
  const subsections = [
    'Startup Details',
    'Company Details',
    'About',
    'Overview'
  ];
  
  return subsections.some(sub => 
    line.toLowerCase().includes(sub.toLowerCase())
  );
};

// Map parsed sections to company object fields
const setCompanyField = (company, section, value) => {
  const sectionLower = section.toLowerCase();
  
  if (sectionLower.includes('description')) {
    company.description = value;
  } 
  else if (sectionLower.includes('tagline')) {
    company.tagline = value;
  }
  else if (sectionLower.includes('funding')) {
    company.funding = value;
  }
  else if (sectionLower.includes('industry') || sectionLower.includes('industries')) {
    // Split industries by common separators
    company.industry = value.split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  else if (sectionLower.includes('modifier')) {
    // Parse modifiers as tags
    company.tags = value.split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  else if (sectionLower.includes('location')) {
    company.location = value;
  }
  else if (sectionLower.includes('founded')) {
    company.founded = value;
  }
  else if (sectionLower.includes('team') || sectionLower.includes('employee')) {
    company.employees = value;
  }
  else if (sectionLower.includes('website') || sectionLower.includes('learn more')) {
    // Extract website URL if it's in a "Go to..." format
    if (value.toLowerCase().includes('go to')) {
      company.website = value; // Keep the full text for now
    } else {
      company.website = value;
    }
  }
  else if (sectionLower.includes('newlab relationship')) {
    company.newlabRelationship = value;
  }
  else if (sectionLower.includes('membership')) {
    company.membershipStatus = value;
  }
};

// Generate a sample of the expected format for users
export const getBulkImportSample = () => {
  return `Company Name Here
Startup Details
Description
Brief description of what the company does and their main products or services.

Funding Stage
Early (Seed to A)

Industry
Technology
Manufacturing
Logistics

Modifiers
AI
Robotics
Sustainability

Newlab Relationship
Portfolio

Membership Status
Active Member

Newlab Location(s)
Detroit

Founded
2020

Team Size
15-25

Learn More
Go to Startup's Website`;
};
