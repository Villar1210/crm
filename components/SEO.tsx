import React from 'react';
// import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  schemaJsonLd?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = () => {
  return null;
};
