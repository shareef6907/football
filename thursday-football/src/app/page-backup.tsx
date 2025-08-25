'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Users, Trophy, Target, Shield, Clock, Star, Calendar } from 'lucide-react';
import { supabase, getAllPlayers, submitPlayerStats, hasPlayerSubmittedThisWeek, getPlayerRankings, PLAYERS } from '../../lib/supabase';

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

  const getPreviousThursday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysBack;
    
    if (dayOfWeek === 4) {
      const currentHour = today.getHours();
      daysBack = currentHour >= 20 ? 0 : 7;
    } else if (dayOfWeek > 4) {
      daysBack = dayOfWeek - 4;
    } else {
      daysBack = dayOfWeek + 3;
    }
    
    const previousThursday = new Date();
    previousThursday.setDate(today.getDate() - daysBack);
    previousThursday.setHours(20, 0, 0, 0);
    return previousThursday;
  };

  const getNextThursday = () => {
    const today = new Date();
    const thursday = new Date();
    thursday.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7));
    if (thursday <= today) {
      thursday.setDate(thursday.getDate() + 7);
    }
    thursday.setHours(20, 0, 0, 0);
    return thursday;
  };

  const [nextGame, setNextGame] = useState(getNextThursday());
  const [previousGame, setPreviousGame] = useState(getPreviousThursday());
  const [timeLeft, setTimeLeft] = useState('');

  // Load data from Supabase
  useEffect(() => {
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

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const distance = nextGame.getTime() - now.getTime();
      
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Game Time! 🎉');
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

  // Show content immediately, load data in background

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
      <div className="relative z-10">
        <div className="container mx-auto px-8 py-16 max-w-6xl space-y-24">
        
        {/* Hero Header */}
        <section className="text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 leading-tight">
              Thursday Football League
            </h1>
            <p className="text-xl text-gray-300 font-medium">Elite Competition • Professional Stats • Weekly Champions</p>
          </div>
          
          {/* Next Game Countdown - Hero Card */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-20"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Clock className="w-8 h-8 text-blue-400" />
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Next Game: Thursday, {formatGameDate(nextGame)}, 8PM
                </h2>
              </div>
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 animate-pulse">
                ⏰ {timeLeft}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Submission Section - Modern Card Design */}
        <section className="space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/10 rounded-full border border-purple-500/20">
              <Target className="w-6 h-6 text-purple-400" />
              <span className="text-lg font-semibold text-purple-300">Weekly Stats Submission</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Submit Stats for Thursday Game<br />
              <span className="text-2xl md:text-3xl text-gray-300 font-normal">
                {formatGameDate(previousGame).split(' ')[0]} {formatGameDate(previousGame).split(' ')[1]}
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              ⚠️ One submission per week only • Submission window: Thursday 8PM - Wednesday 11:59PM
            </p>
          </div>
          
          {/* Stats Form Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/20 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-xl">
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-12">
            {/* Player Selection */}
            <div className="space-y-6 sm:space-y-10">
              <div>
                <label className="block text-lg sm:text-xl font-medium mb-4 sm:mb-6 text-gray-200">Select Player</label>
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
                    className="w-full p-4 text-lg bg-gray-700/80 backdrop-blur-sm rounded-xl border border-gray-600 focus:border-purple-400 focus:outline-none appearance-none transition-all"
                  >
                    <option value="">Choose a player...</option>
                    {playerNames.map(name => (
                      <option key={name} value={name.toLowerCase().replace('-', '')}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Stats Input Fields */}
            {selectedPlayer && (
              <div className="space-y-6 sm:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                  <div>
                    <label className="block text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-200">Goals ⚽</label>
                    <input 
                      type="number" 
                      min="0"
                      disabled={submissionStatus[selectedPlayer]}
                      className={`w-full p-4 text-lg rounded-xl border focus:outline-none transition-all ${
                        submissionStatus[selectedPlayer]
                          ? 'bg-gray-600/50 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 focus:border-green-400 text-white'
                      }`}
                      onChange={(e) => updateFormData('goals', parseInt(e.target.value) || 0)}
                      value={formData.goals}
                    />
                  </div>
                  <div>
                    <label className="block text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-200">Assists ⚡</label>
                    <input 
                      type="number" 
                      min="0"
                      disabled={submissionStatus[selectedPlayer]}
                      className={`w-full p-4 text-lg rounded-xl border focus:outline-none transition-all ${
                        submissionStatus[selectedPlayer]
                          ? 'bg-gray-600/50 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 focus:border-blue-400 text-white'
                      }`}
                      onChange={(e) => updateFormData('assists', parseInt(e.target.value) || 0)}
                      value={formData.assists}
                    />
                  </div>
                  <div>
                    <label className="block text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-200">Saves 🧤</label>
                    <input 
                      type="number" 
                      min="0"
                      disabled={submissionStatus[selectedPlayer]}
                      className={`w-full p-4 text-lg rounded-xl border focus:outline-none transition-all ${
                        submissionStatus[selectedPlayer]
                          ? 'bg-gray-600/50 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 focus:border-yellow-400 text-white'
                      }`}
                      onChange={(e) => updateFormData('saves', parseInt(e.target.value) || 0)}
                      value={formData.saves}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <label className="block text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-200">Form Status</label>
                    <select 
                      disabled={submissionStatus[selectedPlayer]}
                      className={`w-full p-4 text-lg rounded-xl border focus:outline-none transition-all ${
                        submissionStatus[selectedPlayer]
                          ? 'bg-gray-600/50 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 focus:border-orange-400 text-white'
                      }`}
                      onChange={(e) => updateFormData('form', e.target.value)}
                      value={formData.form}
                    >
                      <option value="injured">🤕 Injured</option>
                      <option value="slightly_injured">😐 Slightly Injured</option>
                      <option value="fit">💪 Fit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-200">Game Result 🏆</label>
                    <select 
                      disabled={submissionStatus[selectedPlayer]}
                      className={`w-full p-4 text-lg rounded-xl border focus:outline-none transition-all ${
                        submissionStatus[selectedPlayer]
                          ? 'bg-gray-600/50 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700/80 backdrop-blur-sm border-gray-600 focus:border-green-400 text-white'
                      }`}
                      onChange={(e) => updateFormData('won', e.target.value === 'true')}
                      value={formData.won ? 'true' : 'false'}
                    >
                      <option value="false">❌ Lost Game (0 pts)</option>
                      <option value="true">🏆 Won Game (+10 pts)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-center pt-6 sm:pt-10">
                  <button
                    onClick={handleSubmitStats}
                    disabled={!selectedPlayer || submissionStatus[selectedPlayer]}
                    className={`px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-semibold rounded-2xl transition-all transform hover:scale-105 shadow-lg ${
                      !selectedPlayer || submissionStatus[selectedPlayer]
                        ? 'bg-gray-600/50 cursor-not-allowed border border-gray-500' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border border-purple-400/50'
                    }`}
                  >
                    {submissionStatus[selectedPlayer]
                      ? '✅ Already Submitted' 
                      : '🚀 Submit Stats'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Player Rankings Table - Enhanced presentation */}
        <div className="bg-gray-700/60 backdrop-blur-md rounded-3xl p-8 sm:p-12 mb-20 sm:mb-32 border border-green-500/40 shadow-xl ring-1 ring-green-400/15">
          <div className="flex flex-col sm:flex-row items-center mb-6 sm:mb-8">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mr-0 sm:mr-3 mb-2 sm:mb-0 text-green-400" />
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300">Player Rankings</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 sm:p-4 text-sm sm:text-xl font-bold">#</th>
                  <th className="text-left p-2 sm:p-4 text-sm sm:text-xl font-bold">Player</th>
                  <th className="text-center p-2 sm:p-4 text-sm sm:text-xl font-bold">⚽ Goals</th>
                  <th className="text-center p-2 sm:p-4 text-sm sm:text-xl font-bold">⚡ Assists</th>
                  <th className="text-center p-2 sm:p-4 text-sm sm:text-xl font-bold">🧤 Saves</th>
                  <th className="text-center p-2 sm:p-4 text-sm sm:text-xl font-bold">🏆 Wins</th>
                  <th className="text-center p-2 sm:p-4 text-sm sm:text-xl font-bold">📊 Total</th>
                  <th className="text-center p-2 sm:p-4 text-sm sm:text-xl font-bold">Form</th>
                </tr>
              </thead>
              <tbody>
                {getRankedPlayers().map((player, index) => (
                  <tr key={player.id} className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-all ${index < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : ''}`}>
                    <td className="p-2 sm:p-4 font-bold text-lg sm:text-2xl">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && (index + 1)}
                    </td>
                    <td className="p-2 sm:p-4 font-semibold text-base sm:text-xl text-blue-300">
                      {player.name}
                      {player.currentBadges && player.currentBadges.length > 0 && (
                        <span className="ml-3">
                          {player.currentBadges.map((badge: any, idx: number) => (
                            <span key={idx} className="animate-pulse text-2xl">{badge}</span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="text-center p-2 sm:p-4 text-base sm:text-xl text-green-400 font-semibold">{player.goals}</td>
                    <td className="text-center p-2 sm:p-4 text-base sm:text-xl text-blue-400 font-semibold">{player.assists}</td>
                    <td className="text-center p-2 sm:p-4 text-base sm:text-xl text-yellow-400 font-semibold">{player.saves}</td>
                    <td className="text-center p-2 sm:p-4 text-base sm:text-xl text-purple-400 font-semibold">{player.wins || 0}</td>
                    <td className="text-center p-2 sm:p-4 font-bold text-lg sm:text-2xl text-orange-400">{player.totalPoints}</td>
                    <td className="text-center p-2 sm:p-4 text-base sm:text-xl">
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

        {/* Current Leaders Dashboard - Premium styling */}
        <div className="bg-gradient-to-br from-gray-800/70 to-gray-700/70 backdrop-blur-md rounded-3xl p-8 sm:p-12 mb-20 sm:mb-32 border border-yellow-500/40 shadow-2xl ring-1 ring-yellow-400/20">
          <h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-yellow-400">
            🏆 Current Leaders 🏆
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-10">
            <div className="bg-gradient-to-br from-purple-900/60 to-blue-900/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-purple-400/30">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 text-center">🏆</div>
              <div className="font-semibold text-base sm:text-xl text-purple-300 text-center">Overall Leader</div>
              <div className="text-lg sm:text-2xl text-white text-center mt-1 sm:mt-2">
                {(() => {
                  const leader = getRankedPlayers()[0];
                  return leader && leader.totalPoints > 0 ? leader.name : 'No leader yet';
                })()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-green-400/30">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 text-center">⚽️</div>
              <div className="font-semibold text-base sm:text-xl text-green-300 text-center">Top Scorer</div>
              <div className="text-lg sm:text-2xl text-white text-center mt-1 sm:mt-2">
                {(() => {
                  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];
                  return topScorer && topScorer.goals > 0 ? `${topScorer.name} (${topScorer.goals})` : 'No goals yet';
                })()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/70 to-cyan-900/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-blue-400/30">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 text-center">⚡️</div>
              <div className="font-semibold text-base sm:text-xl text-blue-300 text-center">Top Assists</div>
              <div className="text-lg sm:text-2xl text-white text-center mt-1 sm:mt-2">
                {(() => {
                  const topAssists = [...players].sort((a, b) => b.assists - a.assists)[0];
                  return topAssists && topAssists.assists > 0 ? `${topAssists.name} (${topAssists.assists})` : 'No assists yet';
                })()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-yellow-400/30">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 text-center">🎖️</div>
              <div className="font-semibold text-base sm:text-xl text-yellow-300 text-center">Top Saves</div>
              <div className="text-lg sm:text-2xl text-white text-center mt-1 sm:mt-2">
                {(() => {
                  const topSaves = [...players].sort((a, b) => b.saves - a.saves)[0];
                  return topSaves && topSaves.saves > 0 ? `${topSaves.name} (${topSaves.saves})` : 'No saves yet';
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Team Generator - Professional layout */}
        <div className="bg-gray-750/60 backdrop-blur-md rounded-3xl p-8 sm:p-12 mb-20 sm:mb-32 border border-cyan-500/30 shadow-xl ring-1 ring-cyan-400/10">
          <div className="flex flex-col sm:flex-row items-center mb-6 sm:mb-8">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 mr-0 sm:mr-3 mb-2 sm:mb-0 text-cyan-400" />
            <h3 className="text-2xl sm:text-3xl font-bold text-cyan-300">Generate Balanced Teams</h3>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            {playerNames.map(name => {
              const playerId = name.toLowerCase().replace('-', '');
              const playerStats = players.find(p => p.id === playerId);
              return (
                <label key={name} className="flex items-center p-4 bg-gray-700/60 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-gray-600/60 transition-all border border-gray-600/50">
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
                    className="mr-3 w-4 h-4"
                  />
                  <div>
                    <span className="text-lg font-medium">{name}</span>
                    {playerStats && (
                      <div className="text-sm text-gray-400">
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

          <div className="text-center mb-12">
            <p className="text-gray-400 mb-6 text-xl">Selected: {selectedPlayers.length} players</p>
            <button
              onClick={generateTeams}
              disabled={selectedPlayers.length < 4}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-10 py-4 rounded-2xl font-semibold text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/50"
            >
              Generate Teams ⚽
            </button>
          </div>

          {showTeams && generatedTeams.length === 2 && (
            <div className="grid lg:grid-cols-2 gap-12 mt-12">
              {generatedTeams.map((team, teamIndex) => (
                <div key={teamIndex} className={`p-6 rounded-2xl backdrop-blur-sm border-2 ${teamIndex === 0 ? 'bg-red-900/40 border-red-500/60' : 'bg-blue-900/40 border-blue-500/60'}`}>
                  <h4 className="text-2xl font-bold mb-6 text-center">
                    Team {teamIndex === 0 ? 'Red' : 'Blue'} {teamIndex === 0 ? '🔴' : '🔵'}
                  </h4>
                  <div className="space-y-3">
                    {team.map((player: any) => (
                      <div key={player.id} className="flex justify-between items-center p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-600/50">
                        <span className="text-lg font-medium">{player.name}</span>
                        <div className="text-sm text-gray-400">
                          <span className="font-semibold">{player.totalPoints} pts</span>
                          <span className="ml-2">
                            {player.form === 'injured' && '🤕'}
                            {player.form === 'slightly_injured' && '😐'}
                            {player.form === 'fit' && '💪'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-6 font-bold text-2xl bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-600/50">
                    Total: {team.reduce((sum: number, player: any) => sum + player.totalPoints, 0)} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scoring System & Prizes - Executive presentation */}
        <div className="bg-gradient-to-br from-gray-800/80 to-indigo-900/30 backdrop-blur-md rounded-3xl p-10 sm:p-14 mb-20 sm:mb-32 border border-indigo-500/40 shadow-2xl ring-1 ring-indigo-400/20">
          <div className="flex items-center mb-8">
            <Shield className="w-8 h-8 mr-3 text-indigo-400" />
            <h3 className="text-3xl font-bold text-indigo-300">Scoring System & Prizes</h3>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-10">
            {/* Point System */}
            <div className="bg-gradient-to-br from-blue-900/60 to-cyan-900/60 backdrop-blur-sm p-6 rounded-2xl border border-blue-400/30">
              <h4 className="font-bold text-2xl text-cyan-300 mb-6 text-center">📊 Point System</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg">⚽ Goal:</span>
                  <span className="text-green-400 font-bold text-xl">5 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg">⚡ Assist:</span>
                  <span className="text-blue-400 font-bold text-xl">3 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg">🧤 Save:</span>
                  <span className="text-yellow-400 font-bold text-xl">2 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg">🏆 Win Game:</span>
                  <span className="text-orange-400 font-bold text-xl">10 pts</span>
                </div>
              </div>
            </div>

            {/* Weekly Prizes */}
            <div className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 backdrop-blur-sm p-6 rounded-2xl border border-green-400/30">
              <h4 className="font-bold text-2xl text-emerald-300 mb-6 text-center">🏆 Weekly Awards</h4>
              <div className="space-y-4">
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
              <p className="text-sm text-gray-400 mt-6 text-center">
                * Badges reset every Thursday at 8PM
              </p>
            </div>

            {/* Monthly Prizes */}
            <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 backdrop-blur-sm p-6 rounded-2xl border border-purple-400/30">
              <h4 className="font-bold text-2xl text-pink-300 mb-6 text-center">🌟 Monthly Awards</h4>
              <div className="space-y-4">
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
              <p className="text-sm text-gray-400 mt-6 text-center">
                * Badges remain for entire month
              </p>
            </div>

            {/* 4-Month Prizes */}
            <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 backdrop-blur-sm p-6 rounded-2xl border border-yellow-400/30">
              <h4 className="font-bold text-2xl text-yellow-300 mb-6 text-center">👑 4-Month Legends</h4>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center text-lg mb-2">
                    <span>🏆💥 Ballon D&apos;or</span>
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
              <p className="text-sm text-gray-400 mt-6 text-center">
                * Ultimate prestige badges
              </p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-gray-700/60 backdrop-blur-sm rounded-2xl border border-gray-600/50">
            <p className="text-center text-xl">
              <span className="font-bold text-yellow-400 text-2xl">🎯 Pro Tip:</span> 
              <span className="text-gray-300 block mt-2"> 
                Winning games gives the biggest point boost! Focus on teamwork to maximize your ranking.
              </span>
            </p>
          </div>
        </div>

        {/* Visual Separator */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent mb-16 sm:mb-24"></div>
        
        {/* Admin Access Button */}
        <div className="text-center mt-12 mb-16">
          <a
            href="/admin"
            className="inline-flex items-center px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-all text-gray-400 hover:text-white border border-gray-600/30 hover:border-gray-500/50"
          >
            <Shield className="w-5 h-5 mr-2" />
            Admin Access
          </a>
        </div>
        
      </div>
      </div>
    </div>
  );
};

export default ThursdayFootballApp;