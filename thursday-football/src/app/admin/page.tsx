'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Eye, EyeOff } from 'lucide-react';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20 shadow-2xl max-w-md w-full mx-4">
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
      <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-16 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            🛠️ Admin Panel
          </h1>
          <p className="text-xl text-gray-300">Thursday Football League Administration</p>
          
          <button
            onClick={handleLogout}
            className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all text-gray-300 hover:text-white"
          >
            🚪 Logout
          </button>
        </div>

        {/* Reset Stats Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-8 border border-red-500/20">
          <div className="flex items-center mb-6">
            <Trash2 className="w-8 h-8 mr-3 text-red-400" />
            <h3 className="text-2xl sm:text-3xl font-bold text-red-300">Reset Player Stats</h3>
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

        {/* Quick Navigation */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
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