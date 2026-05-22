import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPoll, vote } from '../api/poll';
import { LogOut, RefreshCcw, Vote, User } from 'lucide-react';
import { motion } from 'framer-motion';

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const intervalRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const endSession = useCallback(() => {
    stopPolling();
    logout();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, [stopPolling, logout]);

  const fetchPoll = async (showLoading = false) => {
    const token = localStorage.getItem('token');
    if (isTokenExpired(token)) {
      endSession();
      return;
    }

    if (showLoading) setLoading(true);
    try {
      const data = await getPoll();
      setPolls(data.polls);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch poll', err);
      if (err.response?.status === 401) {
        endSession();
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll(true);

    intervalRef.current = setInterval(() => {
      fetchPoll();
    }, 10000);

    const onSessionExpired = () => {
      stopPolling();
      logout();
    };
    window.addEventListener('auth:session-expired', onSessionExpired);

    return () => {
      stopPolling();
      window.removeEventListener('auth:session-expired', onSessionExpired);
    };
  }, [stopPolling, logout]);

  const handleVote = async (optionId) => {
    setVoting(optionId);
    try {
      await vote(optionId);
      await fetchPoll();
    } catch (err) {
      if (err.response?.status === 401) {
        endSession();
        return;
      }
      alert(err.response?.data?.message || 'Vote failed.');
    } finally {
      setVoting(null);
    }
  };

  const handleLogout = () => {
    stopPolling();
    logout();
  };

  const totalVotes = polls.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <User className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.email}</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold font-sans">Role: Authenticated Voter</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-colors border border-red-500/50 font-bold"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </header>

      <main className="bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 flex items-center space-x-2 text-slate-500 text-sm">
          {loading ? (
            <RefreshCcw size={16} className="animate-spin text-blue-500" />
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">Are You Still In?</h1>
          <p className="text-slate-400">Total Votes Cast: <span className="text-blue-400 font-bold">{totalVotes}</span></p>
        </div>

        <div className="space-y-12">
          {polls.map((option) => {
            const percentage = totalVotes > 0 ? (option.count / totalVotes) * 100 : 0;
            return (
              <div key={option.id} className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    {option.label}
                    <span className="ml-4 text-slate-500 text-lg font-medium">{option.count} votes</span>
                  </h3>
                  <span className="text-2xl font-black text-blue-400">{Math.round(percentage)}%</span>
                </div>

                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  />
                </div>

                <button
                  onClick={() => handleVote(option.id)}
                  disabled={voting !== null}
                  className={`w-full py-4 rounded-xl flex items-center justify-center space-x-2 font-black transition-all transform active:scale-95 ${
                    voting === option.id
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-900 hover:bg-blue-50 px-6'
                  }`}
                >
                  {voting === option.id ? (
                    <RefreshCcw size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Vote size={20} />
                      <span>Vote for {option.label}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="text-center text-slate-500 text-sm">
        <p>Polling frequency: Every 10 seconds</p>
        <p className="mt-1 italic">Token expires in 60 seconds. See what happens when it does!</p>
      </footer>
    </div>
  );
};

export default Dashboard;
