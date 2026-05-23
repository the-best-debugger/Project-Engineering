import React, { useState } from 'react';

const CARD_STYLE = { marginBottom: '0' };

const MissionCard = React.memo(({ mission, onDelete }) => {
  const [showCrew, setShowCrew] = useState(false);

  return (
    <div style={CARD_STYLE} className="card">
      <div className="card-banner">
        <div className="banner-overlay"></div>
        <span className="rocket-tag">{mission.rocket}</span>
        <h3 className="card-title">{mission.name}</h3>
      </div>

      <div className="card-content">
        <p className="mission-date">
          {new Date(mission.launchDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>

        <div className="card-actions">
          <div className="action-row">
            <button
              onClick={() => setShowCrew(!showCrew)}
              className="btn btn-secondary"
            >
              {showCrew ? 'DIMISS ROSTER' : 'ACCESS CREW'}
            </button>
            <button
              onClick={() => onDelete(mission.id)}
              className="btn btn-danger"
            >
              ABORT
            </button>
          </div>

          {showCrew && mission.crew?.length > 0 && (
            <div className="crew-section">
              <span className="crew-label">Active Personnel</span>
              <div className="crew-grid">
                {mission.crew.map((member) => (
                  <div key={member.id} className="crew-item">
                    <span className="crew-name">{member.name}</span>
                    <span className="crew-role">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MissionCard.displayName = 'MissionCard';

export default MissionCard;
