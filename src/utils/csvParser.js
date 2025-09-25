// CSV Parser for MC-Network data
export const parseCSV = (csvContent) => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  // Get headers from first line
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Find column indices
  const nameIndex = headers.findIndex(h => h.toLowerCase().includes('company name'));
  const logoIndex = headers.findIndex(h => h.toLowerCase().includes('logo url'));
  const headerImageIndex = headers.findIndex(h => h.toLowerCase().includes('header image'));
  const qrCodeIndex = headers.findIndex(h => h.toLowerCase().includes('qr code'));
  const photoIndex = headers.findIndex(h => h.toLowerCase().includes('photo url'));
  const taglineIndex = headers.findIndex(h => h.toLowerCase().includes('tagline'));
  const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
  const detroitStoryIndex = headers.findIndex(h => h.toLowerCase().includes('detroit'));
  const fundingIndex = headers.findIndex(h => h.toLowerCase().includes('funding'));
  const websiteIndex = headers.findIndex(h => h.toLowerCase().includes('website'));
  
  // Industry columns (there are multiple)
  const industryIndices = headers.map((h, i) => 
    h.toLowerCase().includes('industry') ? i : -1
  ).filter(i => i !== -1);

  const companies = [];

  // Parse each data line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Split CSV line handling quoted values
    const columns = parseCSVLine(line);
    
    if (columns.length < 2) continue;

    // Map columns to company object properties
    const company = {
      id: columns[nameIndex].toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      name: columns[nameIndex] && columns[nameIndex].trim(),
      logo: columns[logoIndex] && columns[logoIndex].trim(),
      headerImage: columns[headerImageIndex] && columns[headerImageIndex].trim(),
      qrCode: (columns[qrCodeIndex] && columns[qrCodeIndex].trim()) || '',
      tagline: (columns[taglineIndex] && columns[taglineIndex].trim()) || '',
      description: (columns[descriptionIndex] && columns[descriptionIndex].trim()) || 'No description available',
      detroitStory: (columns[detroitStoryIndex] && columns[detroitStoryIndex].trim()) || '',
      funding: (columns[fundingIndex] && columns[fundingIndex].trim()) || 'Not disclosed',
      website: (columns[websiteIndex] && columns[websiteIndex].trim()) || '#',
      industry: industryIndices
        .map(index => columns[index] && columns[index].trim())
        .filter(industry => industry && industry !== 'Industry' && industry !== 'Modifiers')
        .slice(0, 3), // Take max 3 industries
      images: [
        (columns[photoIndex] && columns[photoIndex].trim()) || getPlaceholderImage(columns[nameIndex] && columns[nameIndex].trim(), 1),
        getPlaceholderImage(columns[nameIndex] && columns[nameIndex].trim(), 2)
      ].filter(img => img), // Remove empty images
      tags: industryIndices
        .map(index => columns[index] && columns[index].trim())
        .filter(industry => industry && industry !== 'Industry' && industry !== 'Modifiers')
        .concat(['Detroit', 'Startup']),
      employees: getRandomEmployeeCount(),
      location: 'Detroit, MI',
      founded: getRandomFoundedYear()
    };

    companies.push(company);
  }

  console.log(`Parsed ${companies.length} companies from CSV`);
  return companies.slice(0, 62); // Limit to 62 companies
};

// Helper function to parse CSV line with proper quote handling
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // Add the last field
  return result;
};

// Generate consistent company ID from name
const generateCompanyId = (name) => {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Generate placeholder logo URL
const getPlaceholderLogo = (name) => {
  const colors = ['FAC853', 'FF6B6B', '4ECDC4', '45B7D1', '96C93F', 'FFEAA7'];
  const colorIndex = name.length % colors.length;
  const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
  return `https://via.placeholder.com/200x200/${colors[colorIndex]}/000000?text=${initials}`;
};

// Generate placeholder image URL
const getPlaceholderImage = (name, index) => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96C93F', 'FFEAA7', 'DDA0DD'];
  const colorIndex = (name.length + index) % colors.length;
  return `https://via.placeholder.com/800x400/${colors[colorIndex]}/FFFFFF?text=${name}+${index}`;
};

// Generate random employee count
const getRandomEmployeeCount = () => {
  const ranges = ['1-10', '11-50', '51-200', '201-500', '501-1000'];
  return ranges[Math.floor(Math.random() * ranges.length)];
};

// Generate random founded year
const getRandomFoundedYear = () => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 10; // Companies founded in last 10 years
  return (startYear + Math.floor(Math.random() * 10)).toString();
};
