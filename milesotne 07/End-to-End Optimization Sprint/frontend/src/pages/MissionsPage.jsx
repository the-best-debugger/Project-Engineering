import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MissionList from '../components/MissionList';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const MissionsPage = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMissions = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/missions`, {
          params: { page: 1, limit: 200 },
          signal: controller.signal,
        });
        setMissions(response.data.data ?? response.data);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Error fetching missions:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMissions();
    return () => controller.abort();
  }, []);

  const handleDelete = useCallback((id) => {
    setMissions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Space Mission Logs</h1>
        <p className="subtitle">Real-time telemetry and mission catalog</p>
      </header>

      {loading ? (
        <div className="loader">
          <div className="spinner"></div>
        </div>
      ) : (
        <MissionList missions={missions} onDelete={handleDelete} />
      )}
    </div>
  );
};

export default MissionsPage;
