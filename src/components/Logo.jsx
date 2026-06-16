import React from 'react';
import logoImage from '../images/a00b2158-82d4-4c37-8602-a33e18a7a9f2_removalai_preview.webp';

const LogoIcon = ({ size = 26 }) => (
  <span
    style={{
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
      flexShrink: 0,
    }}
  >
    <img
      src={logoImage}
      alt="BagSearch logo"
      loading="eager"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        transform: 'scale(1.45)',
        transformOrigin: 'center',
        filter: 'drop-shadow(0 3px 8px rgba(201,75,44,0.25))',
      }}
    />
  </span>
);

export default LogoIcon;
