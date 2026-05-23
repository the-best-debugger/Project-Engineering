import React, { useState, useMemo } from 'react';
import ScoreCard from './ScoreCard';
import { Search } from 'lucide-react';

const ScoreList = ({ scores, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScores = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return scores.filter(
      (s) =>
        s.game.toLowerCase().includes(term) ||
        s.player.toLowerCase().includes(term)
    );
  }, [scores, searchTerm]);

  return (
    <div className="list-wrapper">
      <div className="search-container">
        <div className="search-field-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search game, player, or score..."
            className="premium-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="score-grid">
        {filteredScores.map((score) => (
          <ScoreCard key={score.id} score={score} onDelete={onDelete} />
        ))}
      </div>

      {filteredScores.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 0',
            color: 'var(--text-muted)',
          }}
        >
          <div
            style={{ fontFamily: 'JetBrains Mono', marginBottom: '0.5rem' }}
          >
            RESULT_NOT_FOUND
          </div>
          <p style={{ fontStyle: 'italic' }}>
            No matches found in the arcade mainframe.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoreList;
