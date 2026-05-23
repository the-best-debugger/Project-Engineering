import React, { useState, useMemo } from 'react';
import MissionCard from './MissionCard';

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;

const MissionList = ({ missions, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filteredMissions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return missions
      .filter((m) => m.name.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.launchDate) - new Date(a.launchDate));
  }, [missions, searchTerm]);

  const visibleMissions = filteredMissions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMissions.length;

  return (
    <div className="list-wrapper">
      <div className="search-area">
        <div className="search-box">
          <div className="search-input-wrapper">
            <div className="search-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ENCRYPTED SEARCH: FREQUENCY SCAN..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(INITIAL_VISIBLE);
              }}
            />
          </div>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">Nodes</span>
              <span className="stat-value">{filteredMissions.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mission-grid">
        {visibleMissions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onDelete={onDelete} />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
          >
            Load More ({visibleMissions.length} of {filteredMissions.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default MissionList;
