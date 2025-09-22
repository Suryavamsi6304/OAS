import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  className = '', 
  padding = 'medium',
  shadow = true,
  ...props 
}) => {
  const classes = [
    'card',
    `card-padding-${padding}`,
    shadow && 'card-shadow',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;