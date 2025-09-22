import React from 'react';
import './StatCard.css';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  className = '' 
}) => {
  return (
    <div className={`stat-card stat-card-${color} ${className}`}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-content">
        <h3 className="stat-card-value">{value}</h3>
        <p className="stat-card-title">{title}</p>
      </div>
    </div>
  );
};

export default StatCard;