import { useState } from 'react';
import './RideFilters.css';

function RideFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    source: '',
    destination: '',
    date: ''
  });
  const [isExpanded, setIsExpanded] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      source: '',
      destination: '',
      date: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.source || filters.destination || filters.date;
  const activeFilterCount = [filters.source, filters.destination, filters.date].filter(Boolean).length;

  return (
    <div className={`ride-filters ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="filters-header">
        <div className="header-left">
          <button 
            className="toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
          </button>
          <h3 className="filters-title">
            <span className="title-icon">🔍</span>
            Search Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button className="btn-clear-filters" onClick={handleClearFilters}>
            <span>✕</span> Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="source" className="filter-label">
                <span className="label-icon">📍</span>
                <span className="label-text">Pickup Location</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={filters.source}
                  onChange={handleInputChange}
                  placeholder="Where are you starting from?"
                  className="filter-input"
                />
                {filters.source && (
                  <button 
                    className="clear-input-btn"
                    onClick={() => handleInputChange({ target: { name: 'source', value: '' } })}
                    aria-label="Clear source"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="filter-group">
              <label htmlFor="destination" className="filter-label">
                <span className="label-icon">🎯</span>
                <span className="label-text">Destination</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={filters.destination}
                  onChange={handleInputChange}
                  placeholder="Where are you going?"
                  className="filter-input"
                />
                {filters.destination && (
                  <button 
                    className="clear-input-btn"
                    onClick={() => handleInputChange({ target: { name: 'destination', value: '' } })}
                    aria-label="Clear destination"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="filter-group">
              <label htmlFor="date" className="filter-label">
                <span className="label-icon">📅</span>
                <span className="label-text">Travel Date</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={filters.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="filter-input"
                />
                {filters.date && (
                  <button 
                    className="clear-input-btn"
                    onClick={() => handleInputChange({ target: { name: 'date', value: '' } })}
                    aria-label="Clear date"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="active-filters">
              <span className="active-filters-label">Active filters:</span>
              <div className="filter-chips">
                {filters.source && (
                  <div className="filter-chip">
                    <span className="chip-label">From:</span>
                    <span className="chip-value">{filters.source}</span>
                    <button 
                      className="chip-remove"
                      onClick={() => handleInputChange({ target: { name: 'source', value: '' } })}
                    >
                      ✕
                    </button>
                  </div>
                )}
                {filters.destination && (
                  <div className="filter-chip">
                    <span className="chip-label">To:</span>
                    <span className="chip-value">{filters.destination}</span>
                    <button 
                      className="chip-remove"
                      onClick={() => handleInputChange({ target: { name: 'destination', value: '' } })}
                    >
                      ✕
                    </button>
                  </div>
                )}
                {filters.date && (
                  <div className="filter-chip">
                    <span className="chip-label">Date:</span>
                    <span className="chip-value">
                      {new Date(filters.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <button 
                      className="chip-remove"
                      onClick={() => handleInputChange({ target: { name: 'date', value: '' } })}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RideFilters;
