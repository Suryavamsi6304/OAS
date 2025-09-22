import React from 'react';
import './Table.css';

const Table = ({ 
  columns, 
  data, 
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  ...props 
}) => {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="table-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`} {...props}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={column.key || index} className="table-header">
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="table-row">
              {columns.map((column, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`} className="table-cell">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;