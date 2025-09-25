// Utility to generate emoji placeholders for company logos
export const getEmojiPlaceholder = (company) => {
  const { name = '', industry = [], tags = [] } = company;
  
  // Industry-based emoji mapping
  const industryEmojis = {
    'Manufacturing': '🏭',
    'Technology': '💻',
    'Software': '💻',
    'Hardware': '🔧',
    'Automotive': '🚗',
    'Electric Vehicles': '⚡',
    'Clean Energy': '🔋',
    'Renewable Energy': '☀️',
    'Solar': '☀️',
    'Wind': '💨',
    'Robotics': '🤖',
    'AI': '🧠',
    'Machine Learning': '🧠',
    'Healthcare': '🏥',
    'Medical': '⚕️',
    'Biotech': '🧬',
    'Pharma': '💊',
    'Food': '🍎',
    'Agriculture': '🌾',
    'Sustainability': '🌱',
    'Environment': '🌍',
    'Transportation': '🚛',
    'Logistics': '📦',
    'Aerospace': '🚀',
    'Defense': '🛡️',
    'Construction': '🏗️',
    'Real Estate': '🏢',
    'Finance': '💰',
    'Insurance': '🛡️',
    'Education': '📚',
    'Entertainment': '🎬',
    'Gaming': '🎮',
    'Sports': '⚽',
    'Fashion': '👗',
    'Beauty': '💄',
    'Retail': '🛍️',
    'E-commerce': '🛒',
    'Telecommunications': '📡',
    'Media': '📺',
    'Publishing': '📖',
    'Travel': '✈️',
    'Hospitality': '🏨',
    'Marine': '⚓',
    'Maritime': '🚢',
    'Oil & Gas': '⛽',
    'Mining': '⛏️',
    'Materials': '🔩',
    'Chemicals': '⚗️',
    'Textiles': '🧵',
    'Furniture': '🪑',
    'Tools': '🔨',
    'Electronics': '📱',
    'Semiconductors': '💾',
    'Optics': '🔬',
    'Security': '🔒',
    'Consulting': '💼',
    'Services': '⚙️'
  };

  // Check industry for emoji match
  for (const ind of industry) {
    if (industryEmojis[ind]) {
      return industryEmojis[ind];
    }
  }

  // Check tags for emoji match
  for (const tag of tags) {
    if (industryEmojis[tag]) {
      return industryEmojis[tag];
    }
  }

  // Fallback based on company name keywords
  const nameKeywords = {
    'electric': '⚡',
    'auto': '🚗',
    'motor': '🚗',
    'vehicle': '🚗',
    'tech': '💻',
    'soft': '💻',
    'robot': '🤖',
    'ai': '🧠',
    'data': '📊',
    'cloud': '☁️',
    'green': '🌱',
    'eco': '🌱',
    'solar': '☀️',
    'energy': '⚡',
    'power': '⚡',
    'bio': '🧬',
    'med': '⚕️',
    'health': '🏥',
    'food': '🍎',
    'farm': '🌾',
    'agri': '🌾',
    'space': '🚀',
    'aero': '🚀',
    'marine': '⚓',
    'water': '💧',
    'fire': '🔥',
    'security': '🔒',
    'finance': '💰',
    'bank': '🏦',
    'real estate': '🏢',
    'construction': '🏗️',
    'build': '🏗️',
    'material': '🔩',
    'metal': '⚙️',
    'steel': '⚙️',
    'plastic': '🔬',
    'chemical': '⚗️',
    'lab': '🔬',
    'research': '🔬',
    'innovation': '💡',
    'smart': '💡',
    'digital': '📱',
    'mobile': '📱',
    'app': '📱',
    'web': '🌐',
    'internet': '🌐',
    'network': '📡',
    'communication': '📡',
    'media': '📺',
    'game': '🎮',
    'entertainment': '🎬',
    'music': '🎵',
    'art': '🎨',
    'design': '🎨',
    'fashion': '👗',
    'beauty': '💄',
    'retail': '🛍️',
    'shop': '🛍️',
    'store': '🏪',
    'market': '🏪',
    'travel': '✈️',
    'tourism': '✈️',
    'hotel': '🏨',
    'restaurant': '🍽️',
    'logistics': '📦',
    'shipping': '🚛',
    'transport': '🚛',
    'delivery': '📦',
    'warehouse': '🏭',
    'factory': '🏭',
    'manufacturing': '🏭',
    'production': '🏭',
    'tool': '🔧',
    'equipment': '⚙️',
    'machine': '⚙️',
    'engine': '⚙️'
  };

  const lowerName = name.toLowerCase();
  for (const [keyword, emoji] of Object.entries(nameKeywords)) {
    if (lowerName.includes(keyword)) {
      return emoji;
    }
  }

  // Final fallback - use first letter of company name
  const firstLetter = name.charAt(0).toUpperCase();
  const letterEmojis = {
    'A': '🅰️', 'B': '🅱️', 'C': '©️', 'D': '🔷', 'E': '📧', 'F': '🔥',
    'G': '🟢', 'H': '🏨', 'I': 'ℹ️', 'J': '🃏', 'K': '🔑', 'L': '🔗',
    'M': 'Ⓜ️', 'N': '🆕', 'O': '⭕', 'P': '🅿️', 'Q': '🔍', 'R': '♻️',
    'S': '💲', 'T': '🔝', 'U': '🔄', 'V': '✅', 'W': '〰️', 'X': '❌',
    'Y': '💛', 'Z': '⚡'
  };

  return letterEmojis[firstLetter] || '🏢'; // Default to building emoji
};

// Check if a logo URL is valid/accessible
export const isValidLogoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Check for common placeholder patterns
  const placeholderPatterns = [
    /via\.placeholder\.com/i,
    /placeholder/i,
    /example\.com/i,
    /lorem/i,
    /ipsum/i,
    /temp/i,
    /test/i
  ];
  
  return !placeholderPatterns.some(pattern => pattern.test(url));
};


