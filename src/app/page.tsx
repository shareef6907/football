'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Users, Trophy, Target, Shield, Clock, Star, Calendar } from 'lucide-react';
import { supabase, getAllPlayers, submitPlayerStats, hasPlayerSubmittedThisWeek, getPlayerRankings, PLAYERS, getActiveGameSettings, getCurrentSubmissionWindow, isSubmissionWindowOpen } from '../../lib/supabase';

const ThursdayFootballApp = () => {
  const playerNames = PLAYERS;

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [generatedTeams, setGeneratedTeams] = useState<any[]>([]);
  const [showTeams, setShowTeams] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ [key: string]: boolean }>({});
  
  // Form data
  const [formData, setFormData] = useState({
    goals: 0,
    assists: 0,
    saves: 0,
    won: false,
    form: 'fit' as 'injured' | 'slightly_injured' | 'fit'
  });

  // Get the game date for stats submission (current or previous game)
  const getSubmissionGameDate = async () => {
    try {
      const gameSettings = await getActiveGameSettings();
      
      if (gameSettings) {
        return new Date(gameSettings.game_date);
      }
      
      // Fallback to default Thursday logic
      return getPreviousThursday();
    } catch (error) {
      console.error('Error getting submission game date:', error);
      return getPreviousThursday();
    }
  };

  const getPreviousThursday = () => {
    const now = new Date();
    
    // Convert to Bahrain time (UTC+3)
    const bahrainTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    
    // Get this week's Thursday at 6PM
    const thursday = new Date(bahrainTime);
    thursday.setDate(bahrainTime.getDate() - bahrainTime.getDay() + 4); // This week's Thursday
    thursday.setHours(18, 0, 0, 0); // 6PM
    
    // If it's before Thursday 6PM, use previous Thursday 6PM
    if (bahrainTime < thursday) {
      thursday.setDate(thursday.getDate() - 7);
    }
    
    // Convert back to local time for display
    return new Date(thursday.getTime() - (3 * 60 * 60 * 1000));
  };

  // Get next game date from settings or default
  const getNextGameDate = async () => {
    try {
      const gameSettings = await getActiveGameSettings();
      
      if (gameSettings) {
        return new Date(gameSettings.game_date);
      }
      
      // Fallback to default Thursday logic
      return getNextThursday();
    } catch (error) {
      console.error('Error getting next game date:', error);
      return getNextThursday();
    }
  };

  const getNextThursday = () => {
    const now = new Date();
    const today = new Date(now);
    
    // Get this Thursday at 8pm
    const thisThursday = new Date(today);
    const daysUntilThursday = (4 - today.getDay() + 7) % 7;
    thisThursday.setDate(today.getDate() + daysUntilThursday);
    thisThursday.setHours(20, 0, 0, 0); // 8PM
    
    // If it's Thursday and we're between 8PM (20:00) and 9:30PM (21:30), game is in progress
    if (today.getDay() === 4) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const gameStartInMinutes = 20 * 60; // 8PM
      const gameEndInMinutes = 21 * 60 + 30; // 9:30PM
      
      if (currentTimeInMinutes >= gameStartInMinutes && currentTimeInMinutes < gameEndInMinutes) {
        // Game is in progress, return next Thursday
        const nextThursday = new Date(thisThursday);
        nextThursday.setDate(nextThursday.getDate() + 7);
        return nextThursday;
      } else if (currentTimeInMinutes >= gameEndInMinutes) {
        // Game has ended, return next Thursday
        const nextThursday = new Date(thisThursday);
        nextThursday.setDate(nextThursday.getDate() + 7);
        return nextThursday;
      } else {
        // Before game time, return today's game
        return thisThursday;
      }
    }
    
    // If we've passed this Thursday or it's not Thursday, return next Thursday
    if (thisThursday <= now) {
      const nextThursday = new Date(thisThursday);
      nextThursday.setDate(nextThursday.getDate() + 7);
      return nextThursday;
    }
    
    return thisThursday;
  };

  const [nextGame, setNextGame] = useState(getNextThursday());
  const [previousGame, setPreviousGame] = useState(getPreviousThursday());
  const [timeLeft, setTimeLeft] = useState('');
  const [isGameInProgress, setIsGameInProgress] = useState(false);
  const [submissionWindowOpen, setSubmissionWindowOpen] = useState(false);

  // Load game settings and initialize game times
  useEffect(() => {
    const initializeGameTimes = async () => {
      try {
        const nextGameDate = await getNextGameDate();
        const submissionGameDate = await getSubmissionGameDate();
        const windowOpen = await isSubmissionWindowOpen();
        
        setNextGame(nextGameDate);
        setPreviousGame(submissionGameDate);
        setSubmissionWindowOpen(windowOpen);
      } catch (error) {
        console.error('Error initializing game times:', error);
        // Fallback to default
        setNextGame(getNextThursday());
        setPreviousGame(getPreviousThursday());
      }
    };
    
    initializeGameTimes();
    loadPlayersAndStats();
  }, []);

  const loadPlayersAndStats = async () => {
    try {
      setLoading(true);
      
      // Load player rankings from database
      const rankings = await getPlayerRankings();
      
      // Create full player list with stats
      const fullPlayerList = playerNames.map(name => {
        const playerStats = rankings.find((r: any) => r.name === name);
        return {
          id: name.toLowerCase().replace('-', ''),
          name,
          goals: playerStats?.goals || 0,
          assists: playerStats?.assists || 0,
          saves: playerStats?.saves || 0,
          wins: playerStats?.wins || 0,
          totalPoints: playerStats?.totalPoints || 0,
          form: playerStats?.form || 'fit',
          weeklySubmitted: false // Will be checked separately
        };
      });
      
      setPlayers(fullPlayerList);
      
      // Check submission status for each player
      const statusChecks = await Promise.all(
        playerNames.map(async (name) => {
          const submitted = await hasPlayerSubmittedThisWeek(name);
          return { name: name.toLowerCase().replace('-', ''), submitted };
        })
      );
      
      const statusMap: { [key: string]: boolean } = {};
      statusChecks.forEach(({ name, submitted }) => {
        statusMap[name] = submitted;
      });
      setSubmissionStatus(statusMap);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic countdown timer that works with custom game settings
  useEffect(() => {
    const timer = setInterval(async () => {
      const now = new Date();
      
      // Check if game is currently in progress (within 1.5 hours of game time)
      const gameTime = nextGame.getTime();
      const gameStart = gameTime - (30 * 60 * 1000); // 30 min before
      const gameEnd = gameTime + (90 * 60 * 1000);   // 90 min after
      
      if (now.getTime() >= gameStart && now.getTime() < gameEnd) {
        setTimeLeft('🔥 Game in Progress 🔥');
        setIsGameInProgress(true);
        return;
      } else {
        setIsGameInProgress(false);
      }
      
      // Regular countdown
      const distance = gameTime - now.getTime();
      
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Game Time! 🎉');
      }
      
      // Check submission window status every minute
      if (now.getSeconds() === 0) {
        try {
          const windowOpen = await isSubmissionWindowOpen();
          setSubmissionWindowOpen(windowOpen);
        } catch (error) {
          console.error('Error checking submission window:', error);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextGame]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLeaders = () => {
    const rankedByPoints = [...players].sort((a, b) => b.totalPoints - a.totalPoints);
    const rankedByGoals = [...players].sort((a, b) => b.goals - a.goals);
    const rankedByAssists = [...players].sort((a, b) => b.assists - a.assists);
    const rankedBySaves = [...players].sort((a, b) => b.saves - a.saves);
    
    return {
      topPlayer: rankedByPoints[0] || null,
      topScorer: rankedByGoals[0] || null,
      topAssists: rankedByAssists[0] || null,
      topSaves: rankedBySaves[0] || null
    };
  };

  const getRankedPlayers = () => {
    const leaders = getCurrentLeaders();
    
    return [...players]
      .map(player => ({
        ...player,
        currentBadges: [
          ...(leaders.topPlayer?.id === player.id && player.totalPoints > 0 ? ['🏆'] : []),
          ...(leaders.topScorer?.id === player.id && player.goals > 0 ? ['⚽️'] : []),
          ...(leaders.topAssists?.id === player.id && player.assists > 0 ? ['⚡️'] : []),
          ...(leaders.topSaves?.id === player.id && player.saves > 0 ? ['🎖️'] : [])
        ]
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const generateTeams = () => {
    if (selectedPlayers.length < 4) {
      alert('Please select at least 4 players to generate teams');
      return;
    }

    const selectedPlayersData = players.filter((p: any) => selectedPlayers.includes(p.id));
    const shuffled = [...selectedPlayersData].sort(() => Math.random() - 0.5);
    
    const team1: any[] = [];
    const team2: any[] = [];
    
    shuffled.forEach((player, index) => {
      if (index % 2 === 0) {
        team1.push(player);
      } else {
        team2.push(player);
      }
    });

    setGeneratedTeams([team1, team2]);
    setShowTeams(true);
  };

  const handleSubmitStats = async () => {
    if (!selectedPlayer) return;
    
    const playerName = playerNames.find(name => 
      name.toLowerCase().replace('-', '') === selectedPlayer
    );
    
    if (!playerName) return;
    
    // Check if submission window is open
    if (!submissionWindowOpen) {
      alert('Submission window is currently closed! Please check the admin panel for current submission times. 🚫');
      return;
    }
    
    // Check if already submitted
    if (submissionStatus[selectedPlayer]) {
      alert('This player has already submitted stats for this week! 🚫');
      return;
    }
    
    try {
      console.log('Submitting stats for', playerName, 'with data:', {
        goals: formData.goals,
        assists: formData.assists,
        saves: formData.saves,
        won: formData.won,
        form_status: formData.form
      });
      
      const success = await submitPlayerStats(playerName, {
        game_date: previousGame.toISOString().split('T')[0],
        goals: formData.goals,
        assists: formData.assists,
        saves: formData.saves,
        won: formData.won,
        form_status: formData.form
      });
      
      if (success) {
        alert(`Stats submitted for ${playerName}! ✅`);
        setSubmissionStatus(prev => ({ ...prev, [selectedPlayer]: true }));
        await loadPlayersAndStats(); // Refresh data
        
        // Reset form
        setFormData({
          goals: 0,
          assists: 0,
          saves: 0,
          won: false,
          form: 'fit'
        });
        setSelectedPlayer('');
      } else {
        alert('Error submitting stats. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting stats. Please try again.');
    }
  };

  const formatGameDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formatted = date.toLocaleDateString('en-GB', options);
    const day = date.getDate();
    const suffix = day % 10 === 1 && day !== 11 ? 'st' : 
                   day % 10 === 2 && day !== 12 ? 'nd' : 
                   day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    
    return formatted.replace(/\b\d{1,2}\b/, `${day}${suffix}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
      <div className="relative z-10">
        <div className="container mx-auto px-8 py-16 max-w-6xl space-y-48">
        
        {/* Hero Header */}
        <section className="text-center space-y-12 mb-48">
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 leading-tight flex items-center justify-center gap-2 sm:gap-4 md:gap-6 flex-wrap">
              <span className="animate-bounce text-4xl sm:text-5xl md:text-6xl">⚽</span>
              <span className="text-center">Thursday Football League</span>
              <span className="animate-bounce text-4xl sm:text-5xl md:text-6xl" style={{animationDelay: '0.1s'}}>⚽</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 font-medium">Track Your Progress!</p>
          </div>
          
          {/* Next Game Countdown - Hero Card */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/50 shadow-2xl">
              <div className="flex items-center justify-center gap-6 mb-8">
                <Clock className="w-10 h-10 text-blue-400" />
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Next Game: Thursday, <span className="text-yellow-400">{formatGameDate(nextGame)}</span>, 8PM
                </h2>
              </div>
              <div className="text-2xl md:text-3xl font-mono font-black animate-pulse flex items-center justify-center gap-4">
                <span className="text-white">⏰</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">{timeLeft}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Submission Section */}
        <section className="space-y-12 mb-48">
          {/* Section Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-purple-500/10 rounded-full border border-purple-500/20">
              <Target className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-semibold text-purple-300">Weekly Stats Submission</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Submit Stats for Thursday Game<br />
              <span className="text-3xl md:text-4xl text-yellow-400 font-bold">
                {formatGameDate(previousGame).split(' ')[0]} {formatGameDate(previousGame).split(' ')[1]}
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              ⚠️ One submission per week only • 
              {submissionWindowOpen ? (
                <span className="text-green-400"> Submission window is OPEN ✅</span>
              ) : (
                <span className="text-red-400"> Submission window is CLOSED ❌</span>
              )}
            </p>
          </div>
          
          {/* Stats Form Card */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-slate-800/60 to-purple-900/30 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/50 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-16">
                
                {/* Player Selection */}
                <div className="space-y-8">
                  <div>
                    <label className="block text-2xl font-bold mb-8 text-white flex items-center gap-3">
                      <Users className="w-7 h-7 text-purple-400" />
                      Select Player
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedPlayer} 
                        onChange={(e) => {
                          setSelectedPlayer(e.target.value);
                          setFormData({
                            goals: 0,
                            assists: 0,
                            saves: 0,
                            won: false,
                            form: 'fit'
                          });
                        }}
                        className="w-full p-6 text-xl bg-slate-700/80 backdrop-blur-sm rounded-2xl border-2 border-slate-600 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 focus:outline-none appearance-none transition-all text-white font-medium"
                      >
                        <option value="" className="text-gray-400">Choose a player...</option>
                        {playerNames.map(name => (
                          <option key={name} value={name.toLowerCase().replace('-', '')} className="text-white bg-slate-700">{name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 transform -translate-y-1/2 w-8 h-8 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Stats Input Fields */}
                {selectedPlayer && (
                  <div className="space-y-12">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <label className="block text-xl font-bold mb-4 text-white">
                          <span className="text-3xl block mb-2">⚽</span>
                          Goals
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          disabled={submissionStatus[selectedPlayer]}
                          className={`w-full p-6 text-3xl font-black text-center rounded-2xl border-3 transition-all ${
                            submissionStatus[selectedPlayer]
                              ? 'bg-slate-600/30 border-slate-500 cursor-not-allowed text-gray-500' 
                              : 'bg-slate-700/80 border-green-500/60 hover:border-green-400 focus:border-green-400 focus:ring-4 focus:ring-green-400/30 text-white focus:outline-none'
                          }`}
                          onChange={(e) => updateFormData('goals', parseInt(e.target.value) || 0)}
                          value={formData.goals}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="text-center">
                        <label className="block text-xl font-bold mb-4 text-white">
                          <span className="text-3xl block mb-2">⚡</span>
                          Assists
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          disabled={submissionStatus[selectedPlayer]}
                          className={`w-full p-6 text-3xl font-black text-center rounded-2xl border-3 transition-all ${
                            submissionStatus[selectedPlayer]
                              ? 'bg-slate-600/30 border-slate-500 cursor-not-allowed text-gray-500' 
                              : 'bg-slate-700/80 border-blue-500/60 hover:border-blue-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 text-white focus:outline-none'
                          }`}
                          onChange={(e) => updateFormData('assists', parseInt(e.target.value) || 0)}
                          value={formData.assists}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="text-center">
                        <label className="block text-xl font-bold mb-4 text-white">
                          <span className="text-3xl block mb-2">🧤</span>
                          Saves
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          disabled={submissionStatus[selectedPlayer]}
                          className={`w-full p-6 text-3xl font-black text-center rounded-2xl border-3 transition-all ${
                            submissionStatus[selectedPlayer]
                              ? 'bg-slate-600/30 border-slate-500 cursor-not-allowed text-gray-500' 
                              : 'bg-slate-700/80 border-yellow-500/60 hover:border-yellow-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/30 text-white focus:outline-none'
                          }`}
                          onChange={(e) => updateFormData('saves', parseInt(e.target.value) || 0)}
                          value={formData.saves}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    {/* Form Status and Result */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xl font-bold mb-4 text-white flex items-center gap-3">
                          <span className="text-2xl">💪</span>
                          Form Status
                        </label>
                        <select 
                          disabled={submissionStatus[selectedPlayer]}
                          className={`w-full p-5 text-lg rounded-xl border-2 transition-all ${
                            submissionStatus[selectedPlayer]
                              ? 'bg-slate-600/30 border-slate-500 cursor-not-allowed text-gray-500' 
                              : 'bg-slate-700/80 border-orange-500/50 hover:border-orange-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-white focus:outline-none'
                          }`}
                          onChange={(e) => updateFormData('form', e.target.value)}
                          value={formData.form}
                        >
                          <option value="injured">🤕 Injured</option>
                          <option value="slightly_injured">😐 Slightly Injured</option>
                          <option value="fit">💪 Fully Fit</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xl font-bold mb-4 text-white flex items-center gap-3">
                          <span className="text-2xl">🏆</span>
                          Game Result
                        </label>
                        <select 
                          disabled={submissionStatus[selectedPlayer]}
                          className={`w-full p-5 text-lg rounded-xl border-2 transition-all ${
                            submissionStatus[selectedPlayer]
                              ? 'bg-slate-600/30 border-slate-500 cursor-not-allowed text-gray-500' 
                              : 'bg-slate-700/80 border-green-500/50 hover:border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 text-white focus:outline-none'
                          }`}
                          onChange={(e) => updateFormData('won', e.target.value === 'true')}
                          value={formData.won ? 'true' : 'false'}
                        >
                          <option value="false">❌ Lost Game (0 pts)</option>
                          <option value="true">🏆 Won Game (+10 pts)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex justify-center pt-8">
                      <button
                        onClick={handleSubmitStats}
                        disabled={!selectedPlayer || submissionStatus[selectedPlayer] || !submissionWindowOpen}
                        className={`px-16 py-5 text-2xl font-black rounded-2xl transition-all transform hover:scale-105 shadow-2xl ${
                          !selectedPlayer || submissionStatus[selectedPlayer] || !submissionWindowOpen
                            ? 'bg-slate-600/50 cursor-not-allowed text-gray-400 border-2 border-slate-500' 
                            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white border-2 border-purple-500/50 shadow-purple-500/30'
                        }`}
                      >
                        {!submissionWindowOpen
                          ? '🚫 Submission Closed'
                          : submissionStatus[selectedPlayer]
                          ? '✅ Already Submitted' 
                          : '🚀 Submit Weekly Stats'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Player Rankings Section */}
        <section className="space-y-12 mb-48">
          {/* Section Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-green-500/10 rounded-full border border-green-500/20">
              <Trophy className="w-8 h-8 text-green-400" />
              <span className="text-xl font-semibold text-green-300">Player Rankings</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              League Standings
            </h2>
          </div>

          {/* Rankings Table - Compact Mobile Table */}
          <div className="bg-gradient-to-br from-slate-800/60 to-green-900/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-base sm:text-lg md:text-xl">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left p-2 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg font-bold text-white">#</th>
                    <th className="text-left p-2 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg font-bold text-white">Player</th>
                    <th className="text-center p-2 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg font-bold text-white">⚽ Goals</th>
                    <th className="text-center p-2 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg font-bold text-white">⚡ Assists</th>
                    <th className="text-center p-2 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg font-bold text-white">🧤 Saves</th>
                    <th className="text-center p-2 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg font-bold text-white">🏆 Wins</th>
                    <th className="text-center p-2 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg font-bold text-white">📊 Points</th>
                    <th className="text-center p-2 sm:p-3 md:p-4 text-sm sm:text-base md:text-lg font-bold text-white">💪 Form</th>
                  </tr>
                </thead>
                <tbody>
                  {getRankedPlayers().map((player, index) => (
                    <tr key={player.id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-all ${index < 3 ? 'bg-gradient-to-r from-yellow-900/10 to-transparent' : ''}`}>
                      <td className="p-2 sm:p-3 md:p-4 font-black text-lg sm:text-xl md:text-2xl">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && (index + 1)}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 font-bold text-base sm:text-lg md:text-xl text-blue-300">
                        <div className="flex items-center justify-between">
                          <span>{player.name}</span>
                          {player.currentBadges && player.currentBadges.length > 0 && (
                            <span className="ml-2">
                              {player.currentBadges.map((badge: any, idx: number) => (
                                <span key={idx} className="animate-pulse text-base sm:text-lg md:text-2xl mr-1">{badge}</span>
                              ))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center p-2 sm:p-3 md:p-4 text-lg sm:text-xl md:text-2xl text-green-400 font-bold">{player.goals}</td>
                      <td className="text-center p-2 sm:p-3 md:p-4 text-lg sm:text-xl md:text-2xl text-blue-400 font-bold">{player.assists}</td>
                      <td className="text-center p-2 sm:p-3 md:p-4 text-lg sm:text-xl md:text-2xl text-yellow-400 font-bold">{player.saves}</td>
                      <td className="text-center p-2 sm:p-3 md:p-4 text-lg sm:text-xl md:text-2xl text-purple-400 font-bold">{player.wins || 0}</td>
                      <td className="text-center p-2 sm:p-3 md:p-4 font-black text-lg sm:text-xl md:text-2xl text-orange-400">{player.totalPoints}</td>
                      <td className="text-center p-2 sm:p-3 md:p-4 text-lg sm:text-xl md:text-2xl">
                        {player.form === 'injured' && '🤕'}
                        {player.form === 'slightly_injured' && '😐'}
                        {player.form === 'fit' && '💪'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Current Leaders Dashboard */}
        <section className="space-y-12 mb-48">
          {/* Section Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <Star className="w-8 h-8 text-yellow-400" />
              <span className="text-xl font-semibold text-yellow-300">Current Leaders</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              🏆 Hall of Fame 🏆
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {/* Overall Leader */}
            <div className="bg-gradient-to-br from-purple-900/60 to-blue-900/60 backdrop-blur-sm p-8 rounded-3xl border-2 border-purple-400/40 shadow-2xl transform hover:scale-105 transition-all">
              <div className="text-5xl mb-4 text-center">🏆</div>
              <div className="font-bold text-xl text-purple-300 text-center mb-3">Overall Leader</div>
              <div className="text-2xl text-white text-center font-bold">
                {(() => {
                  const leader = getRankedPlayers()[0];
                  return leader && leader.totalPoints > 0 ? leader.name : 'No leader yet';
                })()}
              </div>
            </div>

            {/* Top Scorer */}
            <div className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 backdrop-blur-sm p-8 rounded-3xl border-2 border-green-400/40 shadow-2xl transform hover:scale-105 transition-all">
              <div className="text-5xl mb-4 text-center">⚽️</div>
              <div className="font-bold text-xl text-green-300 text-center mb-3">Top Scorer</div>
              <div className="text-2xl text-white text-center font-bold">
                {(() => {
                  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];
                  return topScorer && topScorer.goals > 0 ? `${topScorer.name} (${topScorer.goals})` : 'No goals yet';
                })()}
              </div>
            </div>

            {/* Top Assists */}
            <div className="bg-gradient-to-br from-blue-900/60 to-cyan-900/60 backdrop-blur-sm p-8 rounded-3xl border-2 border-blue-400/40 shadow-2xl transform hover:scale-105 transition-all">
              <div className="text-5xl mb-4 text-center">⚡️</div>
              <div className="font-bold text-xl text-blue-300 text-center mb-3">Top Assists</div>
              <div className="text-2xl text-white text-center font-bold">
                {(() => {
                  const topAssists = [...players].sort((a, b) => b.assists - a.assists)[0];
                  return topAssists && topAssists.assists > 0 ? `${topAssists.name} (${topAssists.assists})` : 'No assists yet';
                })()}
              </div>
            </div>

            {/* Top Saves */}
            <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 backdrop-blur-sm p-8 rounded-3xl border-2 border-yellow-400/40 shadow-2xl transform hover:scale-105 transition-all">
              <div className="text-5xl mb-4 text-center">🎖️</div>
              <div className="font-bold text-xl text-yellow-300 text-center mb-3">Top Saves</div>
              <div className="text-2xl text-white text-center font-bold">
                {(() => {
                  const topSaves = [...players].sort((a, b) => b.saves - a.saves)[0];
                  return topSaves && topSaves.saves > 0 ? `${topSaves.name} (${topSaves.saves})` : 'No saves yet';
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* Team Generator Section */}
        <section className="space-y-12 mb-48">
          {/* Section Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-cyan-500/10 rounded-full border border-cyan-500/20">
              <Users className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-semibold text-cyan-300">Team Generator</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Generate Balanced Teams
            </h2>
          </div>

          <div className="bg-gradient-to-br from-slate-800/60 to-cyan-900/20 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/50 shadow-2xl">
            {/* Player Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
              {playerNames.map(name => {
                const playerId = name.toLowerCase().replace('-', '');
                const playerStats = players.find(p => p.id === playerId);
                return (
                  <label key={name} className="flex items-center p-6 bg-slate-700/60 backdrop-blur-sm rounded-2xl cursor-pointer hover:bg-slate-600/60 transition-all border-2 border-slate-600/50 hover:border-cyan-400/50">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(playerId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayers([...selectedPlayers, playerId]);
                        } else {
                          setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
                        }
                      }}
                      className="mr-4 w-5 h-5 text-cyan-400 rounded border-slate-500"
                    />
                    <div>
                      <span className="text-lg font-bold block">{name}</span>
                      {playerStats && (
                        <div className="text-sm text-gray-400 mt-1">
                          {playerStats.totalPoints} pts
                          {playerStats.form === 'injured' && ' 🤕'}
                          {playerStats.form === 'slightly_injured' && ' 😐'}
                          {playerStats.form === 'fit' && ' 💪'}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="text-center space-y-8">
              <p className="text-2xl font-bold">Selected: {selectedPlayers.length} players</p>
              <button
                onClick={generateTeams}
                disabled={selectedPlayers.length < 4}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 px-12 py-4 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-cyan-500/50 shadow-lg"
              >
                Generate Teams ⚽
              </button>
            </div>

            {/* Generated Teams */}
            {showTeams && generatedTeams.length === 2 && (
              <div className="grid lg:grid-cols-2 gap-16 mt-16">
                {generatedTeams.map((team, teamIndex) => (
                  <div key={teamIndex} className={`p-8 rounded-3xl backdrop-blur-sm border-3 ${teamIndex === 0 ? 'bg-red-900/40 border-red-500/60' : 'bg-blue-900/40 border-blue-500/60'}`}>
                    <h4 className="text-3xl font-black mb-8 text-center">
                      Team {teamIndex === 0 ? 'Red' : 'Blue'} {teamIndex === 0 ? '🔴' : '🔵'}
                    </h4>
                    <div className="space-y-4">
                      {team.map((player: any) => (
                        <div key={player.id} className="flex justify-between items-center p-6 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-600/50">
                          <span className="text-xl font-bold">{player.name}</span>
                          <div className="text-lg text-gray-300">
                            <span className="font-bold">{player.totalPoints} pts</span>
                            <span className="ml-4">
                              {player.form === 'injured' && '🤕'}
                              {player.form === 'slightly_injured' && '😐'}
                              {player.form === 'fit' && '💪'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-8 font-black text-3xl bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/50">
                      Total: {team.reduce((sum: number, player: any) => sum + player.totalPoints, 0)} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Scoring System Section */}
        <section className="space-y-12 mb-48">
          {/* Section Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Shield className="w-8 h-8 text-indigo-400" />
              <span className="text-xl font-semibold text-indigo-300">Scoring System & Prizes</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              League Rules & Rewards
            </h2>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-indigo-900/30 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/50 shadow-2xl">
            <div className="grid lg:grid-cols-4 gap-12">
              {/* Point System */}
              <div className="bg-gradient-to-br from-blue-900/60 to-cyan-900/60 backdrop-blur-sm p-8 rounded-3xl border-2 border-blue-400/40">
                <h4 className="font-black text-2xl text-cyan-300 mb-8 text-center flex items-center justify-center gap-3">
                  📊 Point System
                </h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-lg">
                    <span>⚽ Goal:</span>
                    <span className="text-green-400 font-black text-2xl">5 pts</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span>⚡ Assist:</span>
                    <span className="text-blue-400 font-black text-2xl">3 pts</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span>🧤 Save:</span>
                    <span className="text-yellow-400 font-black text-2xl">2 pts</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span>🏆 Win Game:</span>
                    <span className="text-orange-400 font-black text-2xl">10 pts</span>
                  </div>
                </div>
              </div>

              {/* Weekly Awards */}
              <div className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 backdrop-blur-sm p-8 rounded-3xl border-2 border-green-400/40">
                <h4 className="font-black text-2xl text-emerald-300 mb-8 text-center">🏆 Weekly Awards</h4>
                <div className="space-y-6">
                  <div className="flex items-center text-lg">
                    <span>⚽ Top Scorer</span>
                  </div>
                  <div className="flex items-center text-lg">
                    <span>⚡ Top Assists</span>
                  </div>
                  <div className="flex items-center text-lg">
                    <span>🎖️ Top Saves</span>
                  </div>
                  <div className="flex items-center text-lg">
                    <span>🏆 All Rounder</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-8 text-center font-medium">
                  * Badges reset every Thursday at 8PM
                </p>
              </div>

              {/* Monthly Awards */}
              <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 backdrop-blur-sm p-8 rounded-3xl border-2 border-purple-400/40">
                <h4 className="font-black text-2xl text-pink-300 mb-8 text-center">🌟 Monthly Awards</h4>
                <div className="space-y-6">
                  <div className="flex items-center text-lg">
                    <span>⚽ Top Scorer</span>
                  </div>
                  <div className="flex items-center text-lg">
                    <span>☄️ Top Assists</span>
                  </div>
                  <div className="flex items-center text-lg">
                    <span>🧤 Top Saves</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-8 text-center font-medium">
                  * Badges remain for entire month
                </p>
              </div>

              {/* 4-Month Legends */}
              <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 backdrop-blur-sm p-8 rounded-3xl border-2 border-yellow-400/40">
                <h4 className="font-black text-2xl text-yellow-300 mb-8 text-center">👑 4-Month Legends</h4>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-lg mb-2">
                      <span>🏆💥 Ballon D'or</span>
                    </div>
                    <div className="text-sm text-gray-300">(Overall Highest Score)</div>
                  </div>
                  <div className="flex items-center text-lg">
                    <span>⚽⚽⚽ Top Scorer</span>
                  </div>
                  <div className="flex items-center text-lg">
                    <span>☄️☄️☄️ Top Assists</span>
                  </div>
                  <div className="flex items-center text-lg">
                    <span>🎖️🎖️🎖️ Top Saves</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-8 text-center font-medium">
                  * Ultimate prestige badges
                </p>
              </div>
            </div>

            <div className="mt-16 p-10 bg-slate-700/60 backdrop-blur-sm rounded-3xl border-2 border-slate-600/50">
              <p className="text-center text-2xl">
                <span className="font-black text-yellow-400 text-3xl">🎯 Pro Tip:</span> 
                <span className="text-gray-300 block mt-4 text-xl"> 
                  Winning games gives the biggest point boost! Focus on teamwork to maximize your ranking.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Visual Separator */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
        
        {/* Admin Access Button */}
        <div className="text-center py-8">
          <a
            href="/admin"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-2xl transition-all text-white border-2 border-slate-600/50 hover:border-slate-500/70 shadow-lg transform hover:scale-105"
          >
            <Shield className="w-6 h-6 mr-3" />
            Admin Access
          </a>
        </div>

        </div>
      </div>
    </div>
  );
};

export default ThursdayFootballApp;