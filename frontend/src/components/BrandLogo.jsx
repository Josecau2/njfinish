import React from 'react';
import { getBrand } from '../brand/useBrand';

const EMPTY_STYLE = { display: 'inline-block' };

const BrandLogo = ({ className = '', size = 48, alt = '' }) => {
  const brand = getBrand();
  const dataUri = brand?.logoDataURI || brand?.logo?.dataURI || '';
  const resolvedAlt = brand?.logoAlt || alt || '';

  if (!dataUri) {
    return (
      <div
        className={`brand-logo-img ${className}`.trim()}
        style={{ ...EMPTY_STYLE, width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      className={`brand-logo-img ${className}`.trim()}
      src={dataUri}
      width={size}
      height={size}
      alt={resolvedAlt}
      decoding="sync"
      loading="eager"
      draggable={false}
    />
  );
};

export default BrandLogo;
