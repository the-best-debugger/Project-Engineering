import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ScoreList from '../components/ScoreList';
import { Trophy, Gamepad2 } from 'lucide-react';

const ScoresPage = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchScores = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/scores', {
          params: { page: 1, limit: 350 },
          signal: controller.signal,
        });
        const payload = res.data;
        setScores(payload.data ?? payload);
        setTotalCount(payload.pagination?.total ?? payload.length ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchScores();
    return () => controller.abort();
  }, []);

  const handleDelete = useCallback((id) => {
    setScores((prev) => prev.filter((s) => s.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="content-wrapper header-inner">
          <div className="title-group">
            <div className="version-tag">
              <Gamepad2 size={16} className="animate-pulse" />
              <span>Database Entry</span>
            </div>
            <h1 className="main-title">ARCADE HEROES</h1>
          </div>

          <div className="stats-card">
            <div className="stats-icon-box">
              <Trophy size={32} color="var(--accent-cyan)" />
            </div>
            <div>
              <div className="stats-label">Total Highscores</div>
              <div className="stats-value">{totalCount}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="content-wrapper">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p
              style={{
                color: 'var(--accent-cyan)',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
              }}
            >
              CONNECTING_TO_MAINFRAME...
            </p>
          </div>
        ) : (
          <ScoreList scores={scores} onDelete={handleDelete} />
        )}
      </main>
    </div>
  );
};

export default ScoresPage;
