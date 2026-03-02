import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiAward, FiCheck, FiLock } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const DailyChallenge = ({ onStart }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    fetchStatus();
    // Update countdown every minute
    const interval = setInterval(() => {
      updateCountdown();
    }, 60000);
    updateCountdown();
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/daily-challenge/status');
      if (response.data.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching daily challenge status:', error);
      toast.error('Failed to load daily challenge status');
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    setTimeUntilReset(`${hours}h ${minutes}m`);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const isCompleted = status?.isCompleted || false;
  const canPlay = status?.canPlay || false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200"
    >
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎯</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Daily Challenge</h3>
              <p className="text-sm text-gray-600">Complete once per day for bonus rewards!</p>
            </div>
          </div>
          {isCompleted ? (
            <div className="bg-green-100 text-green-700 rounded-full p-2">
              <FiCheck className="w-5 h-5" />
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-700 rounded-full p-2">
              <FiLock className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Rewards */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <FiAward className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Rewards:</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">15</div>
                <div className="text-xs text-gray-500">coins + 25 XP</div>
              </div>
            </div>
          </div>

          {/* Status */}
          {isCompleted ? (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <FiCheck className="w-5 h-5" />
                <span className="font-semibold">Completed Today!</span>
              </div>
              {status.score > 0 && (
                <div className="text-sm text-green-600">
                  Your score: <span className="font-bold">{status.score}%</span>
                </div>
              )}
              <div className="text-xs text-green-600 mt-2">
                Resets in: {timeUntilReset}
              </div>
            </div>
          ) : (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <FiClock className="w-5 h-5" />
                <span className="font-semibold">Available Now!</span>
              </div>
              <div className="text-sm text-blue-600">
                Complete any game to earn bonus rewards
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => {
              if (canPlay && onStart) {
                onStart();
              } else {
                toast.error('Daily challenge already completed. Try again tomorrow!');
              }
            }}
            disabled={!canPlay}
            className={`w-full btn ${
              canPlay
                ? 'btn-primary'
                : 'btn-disabled bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isCompleted ? (
              <>
                <FiCheck className="w-4 h-4 mr-2" />
                Completed
              </>
            ) : (
              <>
                <FiAward className="w-4 h-4 mr-2" />
                Start Daily Challenge
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DailyChallenge;

