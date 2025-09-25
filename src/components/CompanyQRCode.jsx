import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { getCachedData, cacheData, isOnline } from '../utils/cacheManager';

function CompanyQRCode({ companyId, size = 128 }) {
  const [websiteUrl, setWebsiteUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheKey = `company_qr_${companyId}`;

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setError("No company ID provided.");
      return;
    }

    // Try cache first
    const cachedUrl = getCachedData(cacheKey);
    if (cachedUrl) {
      setWebsiteUrl(cachedUrl);
      setLoading(false);
    }

    const fetchCompanyUrl = async () => {
      if (!isOnline()) {
        if (!cachedUrl) setError("Offline and no data in cache.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log(`[QRCode] Fetching from Supabase with id: ${companyId}`);

        const { data, error } = await supabase
          .from('companies')
          .select('website')
          .eq('id', companyId)
          .maybeSingle();

        console.log("[QRCode] Supabase fetch response:", { data, error });

        if (error) throw error;
        
        const url = data && data.website;
        setWebsiteUrl(url);
        if (url) {
          cacheData(cacheKey, url);
        }

      } catch (err) {
        console.error("Error fetching company URL:", err);
        setError("Failed to load company data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyUrl();

    const subscription = supabase
      .channel(`company-website-${companyId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'companies',
          filter: `id=eq.${companyId}`
        },
        (payload) => {
          const newUrl = payload.new.website;
          if (newUrl !== websiteUrl) {
            setWebsiteUrl(newUrl);
            cacheData(cacheKey, newUrl);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [companyId, websiteUrl, cacheKey]);

  if (loading) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: size, 
                height: size,
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                color: 'var(--text-secondary)'
            }}
        >
            Loading...
        </motion.div>
    );
  }

  if (error) {
    return <div style={{ color: 'red', width: size, height: size, textAlign: 'center' }}>{error}</div>;
  }

  if (!websiteUrl) {
    return (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            width: size, 
            height: size,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '10px',
            fontSize: '14px'
        }}
    >
        No website URL available.
    </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{ 
          background: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          display: 'inline-block',
          width: size,
          height: size
        }}
    >
      <QRCode
        value={websiteUrl}
        size={size - 32} // Account for padding
        style={{ width: "100%", height: "auto" }}
        viewBox={`0 0 ${size-32} ${size-32}`}
      />
    </motion.div>
  );
}

export default CompanyQRCode;
