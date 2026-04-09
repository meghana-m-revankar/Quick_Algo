// Optimized Font Awesome implementation using only the icons you need
import React from "react";

// Instead of loading the entire Font Awesome CSS, we'll use SVG icons
// This reduces bundle size significantly

const FontAwesomeIcons = {
  camera: (
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M512 144v288c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h88l12.3-32.9c7-18.7 24.9-31.1 44.9-31.1h125.5c20 0 37.9 12.4 44.9 31.1L424 96h88c26.5 0 48 21.5 48 48zM336 304c0 35.3-28.7 64-64 64s-64-28.7-64-64 28.7-64 64-64 64 28.7 64 64z" />
    </svg>
  ),
  "credit-card": (
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M0 112c0-26.5 21.5-48 48-48h416c26.5 0 48 21.5 48 48v288c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V112zm448 0H64v48h384v-48zm0 80H64v128h384V192z" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H64z" />
    </svg>
  ),
  "shield-alt": (
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264l87 87c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-96-96c-4.5-4.5-7-10.6-7-17V152c0-13.3 10.7-24 24-24z" />
    </svg>
  ),
  "check-circle": (
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm113-303L241 337c-9.4 9.4-24.6 9.4-33.9 0l-17-17c-9.4-9.4-9.4-24.6 0-33.9l96-96c9.4-9.4 24.6-9.4 33.9 0l96 96c9.4 9.4 9.4 24.6 0 33.9l-17 17c-9.4 9.4-24.6 9.4-33.9 0z" />
    </svg>
  ),
  "times-circle": (
    <svg viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47z" />
    </svg>
  ),
};

// Optimized Font Awesome Icon Component
export const FontAwesomeIcon = ({
  name,
  size = 16,
  className = "",
  ...props
}) => {
  const IconSvg = FontAwesomeIcons[name];

  if (!IconSvg) {
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      {...props}
    >
      {IconSvg.props.children}
    </svg>
  );
};

// Export individual icons for direct use
export const CameraIcon = (props) => (
  <FontAwesomeIcon name="camera" {...props} />
);
export const CreditCardIcon = (props) => (
  <FontAwesomeIcon name="credit-card" {...props} />
);
export const DownloadIcon = (props) => (
  <FontAwesomeIcon name="download" {...props} />
);
export const ShieldIcon = (props) => (
  <FontAwesomeIcon name="shield-alt" {...props} />
);
export const ClockIcon = (props) => <FontAwesomeIcon name="clock" {...props} />;
export const CheckCircleIcon = (props) => (
  <FontAwesomeIcon name="check-circle" {...props} />
);
export const TimesCircleIcon = (props) => (
  <FontAwesomeIcon name="times-circle" {...props} />
);

// Default export - the main FontAwesomeIcon component
export default FontAwesomeIcon;
