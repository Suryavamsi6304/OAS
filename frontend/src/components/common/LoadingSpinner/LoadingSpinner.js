import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  className = '',
  fullScreen = false 
}) => {
  const containerClass = fullScreen ? 'spinner-fullscreen' : 'spinner-container';
  const spinnerClass = `spinner spinner-${size}`;

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={spinnerClass} />
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;