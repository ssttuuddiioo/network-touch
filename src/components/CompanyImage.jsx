import React, { useState, useEffect } from 'react';
import { getEmojiPlaceholder } from '../utils/emojiPlaceholders';

const CompanyImage = ({ company, imageType = 'logo', style, className }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState(false);

  // Append a lightweight cache-busting param so updated URLs/images reflect immediately
  const withCacheBuster = (url, key) => {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    // Prefer an explicit key, then DB timestamps, then the URL itself (so when a URL changes, cache busts),
    // and finally a time-based fallback.
    const derivedFromType = imageType === 'logo' ? (company && company.logo) : (company && company.headerImage);
    const cacheKey = key
      || (company && (company.updatedAt || company.updated_at))
      || derivedFromType
      || '';
    // Add a minute bucket so the QR param changes at least once a minute even if nothing else did
    const minuteBucket = Math.floor(Date.now() / 60000);
    const safeKey = encodeURIComponent(String(cacheKey || minuteBucket));
    return `${url}${separator}v=${safeKey}`;
  };

  useEffect(() => {
    // Reset state when company or imageType changes
    setImageSrc(null);
    setError(false);

    if (!company || !company.id) {
        setError(true);
        return;
    }

    // First check if we have a direct URL from Supabase
    if (imageType === 'logo' && company.logo && company.logo.trim() !== '') {
        // Use logo URL from Supabase/external with cache-busting
        const url = withCacheBuster(company.logo);
        setImageSrc(url);
        try { console.log(`[CompanyImage] Using logo URL for ${company.name}:`, url); } catch {}
        return;
    } else if (imageType === 'photo' && company.headerImage && company.headerImage.trim() !== '') {
        // Use header image URL from Supabase/external with cache-busting
        const url = withCacheBuster(company.headerImage);
        setImageSrc(url);
        try { console.log(`[CompanyImage] Using photo URL for ${company.name}:`, url); } catch {}
        return;
    }

    // Fallback to file system if no URL is provided
    const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    const basePath = `/images/companies/${imageType}s/${company.id}`;
    
    // Set a preferred initial path. The onError will handle cycling through others.
    const initialSrc = `${basePath}.${imageType === 'logo' ? 'png' : 'jpg'}`;
    setImageSrc(`${initialSrc}?t=${new Date().getTime()}`); // Cache-busting timestamp

  }, [company, imageType]);

  const handleError = () => {
    const currentSrc = imageSrc;
    if (!currentSrc) {
        setError(true);
        return;
    }

    // Check if we're using a Supabase URL (not a local file path)
    if (currentSrc.startsWith('http') || 
        (imageType === 'logo' && company.logo === currentSrc) || 
        (imageType === 'photo' && company.headerImage === currentSrc)) {
        // If URL from Supabase fails, fall back to file system
        const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
        const basePath = `/images/companies/${imageType}s/${company.id}`;
        const initialSrc = `${basePath}.${imageType === 'logo' ? 'png' : 'jpg'}`;
        setImageSrc(`${initialSrc}?t=${new Date().getTime()}`);
        return;
    }

    // Handle local file paths
    const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    const currentExt = currentSrc.split('.').pop().split('?')[0]; // Remove query params
    const currentIndex = extensions.indexOf(currentExt);
    
    // Try the next extension in the list
    if (currentIndex > -1 && currentIndex < extensions.length - 1) {
        const nextExt = extensions[currentIndex + 1];
        const nextSrc = currentSrc.replace(`.${currentExt}`, `.${nextExt}`).split('?')[0];
        setImageSrc(`${nextSrc}?t=${new Date().getTime()}`); // Cache-busting timestamp
    } else {
        // If we've tried all extensions, show the fallback
        setError(true);
    }
  };

  if (error || !imageSrc) {
    // Calculate font size safely
    let fontSize = '24px';
    if (style && style.height && typeof style.height === 'number') {
      fontSize = `${style.height / 2}px`;
    } else if (style && style.height && typeof style.height === 'string') {
      const heightNum = parseInt(style.height);
      if (!isNaN(heightNum)) {
        fontSize = `${heightNum / 2}px`;
      }
    }

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-secondary)',
          fontSize: fontSize,
          userSelect: 'none'
        }}
        className={className}
      >
        {getEmojiPlaceholder(company)}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={`${company.name} ${imageType}`}
      style={style}
      className={className}
      onError={handleError}
    />
  );
};

export default CompanyImage;
