'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isWeeklyResetting, setIsWeeklyResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [weeklyResetMessage, setWeeklyResetMessage] = useState('');

  // Admin credentials
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'thursday2024';

  useEffect(() => {
    // Check if already authenticated in session
    const isLoggedIn = sessionStorage.getItem('admin_authenticated');
    if (isLoggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setCredentials({ username: '', password: '' });
    } else {
      alert('Invalid credentials! Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  const handleResetStats = async () => {
    if (!confirm('⚠️ Are you sure you want to reset ALL player stats to 0? This action cannot be undone!')) {
      return;
    }

    setIsResetting(true);
    setResetMessage('');

    try {
      const response = await fetch('/api/admin/reset-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset_all' })
      });

      const result = await response.json();

      if (response.ok) {
        setResetMessage('✅ All stats successfully reset to 0');
      } else {
        setResetMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setResetMessage('❌ Failed to reset stats. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleWeeklyReset = async () => {
    if (!confirm('🔄 Reset current week\'s stats only? This will preserve all previous weeks\' data but clear this week\'s submissions.')) {
      return;
    }

    setIsWeeklyResetting(true);
    setWeeklyResetMessage('');

    try {
      const response = await fetch('/api/admin/reset-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset_weekly' })
      });

      const result = await response.json();

      if (response.ok) {
        setWeeklyResetMessage('✅ ' + result.message);
      } else {
        setWeeklyResetMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setWeeklyResetMessage('❌ Failed to reset weekly stats. Please try again.');
    } finally {
      setIsWeeklyResetting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800/60 backdrop-blur-md rounded-3xl p-10 border border-blue-500/30 shadow-2xl max-w-md w-full mx-6 ring-1 ring-blue-400/10">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-400">Thursday Football League</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-3 text-gray-200">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="w-full p-4 text-lg rounded-xl border bg-gray-700/80 backdrop-blur-sm border-gray-600 focus:border-blue-400 text-white focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-lg font-medium mb-3 text-gray-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-4 pr-12 text-lg rounded-xl border bg-gray-700/80 backdrop-blur-sm border-gray-600 focus:border-blue-400 text-white focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              🔐 Login to Admin Panel
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-300 text-center">
              🔒 Secure access to Thursday Football League administration
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <div className="container mx-auto px-6 sm:px-12 py-12 sm:py-24 max-w-6xl">
        
        {/* Header - Enhanced styling */}
        <div className="text-center mb-20 sm:mb-32">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 sm:mb-12">
            🛠️ Admin Panel
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-8">Thursday Football League Administration</p>
          
          <button
            onClick={handleLogout}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-xl transition-all text-white font-semibold shadow-lg transform hover:scale-105"
          >
            🚪 Logout
          </button>
        </div>

        {/* Weekly Reset Section - Premium styling */}
        <div className="bg-gradient-to-br from-gray-800/70 to-blue-900/30 backdrop-blur-md rounded-3xl p-10 sm:p-14 mb-20 sm:mb-32 border border-blue-500/40 shadow-2xl ring-1 ring-blue-400/20">
          <div className="flex items-center mb-6">
            <Calendar className="w-8 h-8 mr-3 text-blue-400" />
            <h3 className="text-2xl sm:text-3xl font-bold text-blue-300">Reset Current Week</h3>
          </div>
          
          <p className="text-gray-400 text-lg mb-6">
            🔄 This will only reset the current week's player statistics while preserving all historical data.
          </p>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <h4 className="text-lg font-semibold text-blue-300 mb-2">✨ Safe Weekly Reset</h4>
            <ul className="text-blue-200 space-y-1">
              <li>• Resets current week's goals, assists, saves, and wins</li>
              <li>• Preserves all previous weeks' historical data</li>
              <li>• Allows fresh submissions for the current week</li>
              <li>• Perfect for weekly league management</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={handleWeeklyReset}
              disabled={isWeeklyResetting}
              className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg ${
                isWeeklyResetting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              }`}
            >
              {isWeeklyResetting ? '🔄 Resetting Week...' : '📅 Reset Current Week Only'}
            </button>

            {weeklyResetMessage && (
              <div className={`px-4 py-2 rounded-xl font-medium ${
                weeklyResetMessage.includes('✅') 
                  ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                  : 'bg-red-900/30 border border-red-500/30 text-red-300'
              }`}>
                {weeklyResetMessage}
              </div>
            )}
          </div>
        </div>

        {/* Full Reset Stats Section - Executive styling */}
        <div className="bg-gradient-to-br from-gray-800/80 to-red-900/30 backdrop-blur-md rounded-3xl p-10 sm:p-14 mb-20 sm:mb-32 border border-red-500/40 shadow-2xl ring-1 ring-red-400/20">
          <div className="flex items-center mb-6">
            <Trash2 className="w-8 h-8 mr-3 text-red-400" />
            <h3 className="text-2xl sm:text-3xl font-bold text-red-300">Reset ALL Historical Data</h3>
          </div>
          
          <p className="text-gray-400 text-lg mb-6">
            ⚠️ This will permanently delete all player statistics and reset the leaderboard to 0.
          </p>

          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <h4 className="text-lg font-semibold text-red-300 mb-2">⚠️ Warning</h4>
            <ul className="text-red-200 space-y-1">
              <li>• All goals, assists, and saves data will be deleted</li>
              <li>• Player rankings will be reset to 0</li>
              <li>• This action cannot be undone</li>
              <li>• All devices will show updated data immediately</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={handleResetStats}
              disabled={isResetting}
              className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg ${
                isResetting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
              }`}
            >
              {isResetting ? '🔄 Resetting...' : '🗑️ Reset All Stats'}
            </button>

            {resetMessage && (
              <div className={`px-4 py-2 rounded-xl font-medium ${
                resetMessage.includes('✅') 
                  ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                  : 'bg-red-900/30 border border-red-500/30 text-red-300'
              }`}>
                {resetMessage}
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation - Professional finish */}
        <div className="bg-gradient-to-br from-gray-800/60 to-purple-900/30 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-purple-500/40 shadow-xl ring-1 ring-purple-400/15">
          <h3 className="text-xl font-bold text-purple-300 mb-4">Quick Navigation</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl font-semibold transition-all transform hover:scale-105 text-center"
            >
              🏠 Back to Main Site
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-all text-gray-300 hover:text-white"
            >
              🔄 Refresh Panel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;