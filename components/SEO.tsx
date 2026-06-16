import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  schemaJsonLd?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = 'Luxe Estate Pro — Imóveis de alto padrão em São Paulo e região.',
  image = '/og-image.jpg',
  type = 'website',
  keywords = [],
  schemaJsonLd,
}) => {
  const fullTitle = title.includes('Ivillar') ? title : `${title} | Ivillar`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Ivillar" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Schema.org JSON-LD */}
      {schemaJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(schemaJsonLd)}
        </script>
      )}
    </Helmet>
  );
};
