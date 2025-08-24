'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Users, Trophy, Target, Shield, Clock } from 'lucide-react';

const ThursdayFootballApp = () => {
  const playerNames = [
    'Ahmed', 'Fasin', 'Hamsheed', 'Jalal', 'Shareef', 'Shaheen', 'Emaad', 
    'Darwish', 'Luqman', 'Nabeel', 'Jinish', 'Afzal', 'Rathul', 'Madan', 
    'Waleed', 'Ahmed-Ateeq', 'Junaid', 'Shafeer', 'Fathah', 'Nithin'
  ];

  const [players, setPlayers] = useState(() => 
    playerNames.map(name => ({
      id: name.toLowerCase().replace('-', ''),
      name,
      goals: 0,
      assists: 0,
      saves: 0,
      won: false,
      form: 'fit',
      rating: 0,
      weeklySubmitted: false,
      badges: [],
      monthlyBadges: [],
      fourMonthBadges: []
    }))
  );

  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [generatedTeams, setGeneratedTeams] = useState<any[]>([]);
  const [showTeams, setShowTeams] = useState(false);

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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const distance = nextGame.getTime() - now.getTime();
      
      if (now.getDay() === 4 && now.getHours() >= 20) {
        const currentThursday = new Date();
        currentThursday.setHours(20, 0, 0, 0);
        
        if (Math.abs(now.getTime() - currentThursday.getTime()) < 60000) {
          setPlayers(prev => prev.map(player => ({ ...player, weeklySubmitted: false })));
          setPreviousGame(currentThursday);
          setNextGame(getNextThursday());
        }
      }
      
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

  const updatePlayerStats = (playerId: string, field: string, value: any) => {
    setPlayers(prev => prev.map(player => {
      if (player.id === playerId) {
        if (field === 'form') {
          return { ...player, [field]: value };
        } else if (field === 'won') {
          return { ...player, [field]: value };
        } else {
          return { ...player, [field]: parseInt(value) || 0 };
        }
      }
      return player;
    }));
  };

  const calculateTotalPoints = (player: any) => {
    const winBonus = player.won ? 10 : 0;
    return (player.goals * 5) + (player.assists * 3) + (player.saves * 2) + player.rating + winBonus;
  };

  const getCurrentLeaders = () => {
    const rankedByPoints = [...players].sort((a, b) => calculateTotalPoints(b) - calculateTotalPoints(a));
    const rankedByGoals = [...players].sort((a, b) => b.goals - a.goals);
    const rankedByAssists = [...players].sort((a, b) => b.assists - a.assists);
    const rankedBySaves = [...players].sort((a, b) => b.saves - a.saves);
    
    return {
      topPlayer: rankedByPoints[0]?.id || null,
      topScorer: rankedByGoals[0]?.id || null,
      topAssists: rankedByAssists[0]?.id || null,
      topSaves: rankedBySaves[0]?.id || null
    };
  };

  const getRankedPlayers = () => {
    const leaders = getCurrentLeaders();
    
    return [...players]
      .map(player => ({
        ...player,
        totalPoints: calculateTotalPoints(player),
        currentBadges: [
          ...(leaders.topPlayer === player.id && calculateTotalPoints(player) > 0 ? ['🏆'] : []),
          ...(leaders.topScorer === player.id && player.goals > 0 ? ['⚽️'] : []),
          ...(leaders.topAssists === player.id && player.assists > 0 ? ['⚡️'] : []),
          ...(leaders.topSaves === player.id && player.saves > 0 ? ['🎖️'] : [])
        ]
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const generateTeams = () => {
    if (selectedPlayers.length < 4) {
      alert('Please select at least 4 players to generate teams');
      return;
    }

    const selectedPlayersData = players.filter(p => selectedPlayers.includes(p.id));
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            ⚽ Thursday Football League ⚽
          </h1>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-blue-500/20">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              <h2 className="text-2xl font-semibold text-blue-300">
                Next Game: Thursday, {formatGameDate(nextGame)}, 8PM
              </h2>
            </div>
            <div className="text-3xl font-semibold text-green-400 animate-pulse">
              ⏰ {timeLeft}
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/20">
          <h3 className="text-2xl font-bold mb-2 flex items-center">
            <Target className="w-6 h-6 mr-2 text-purple-400" />
            Submit Stats for Thursday Game {formatGameDate(previousGame).split(' ')[0]} {formatGameDate(previousGame).split(' ')[1]}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            ⚠️ One submission per week only • Submission window: Thursday 8PM - Wednesday 11:59PM
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Player</label>
              <div className="relative">
                <select 
                  value={selectedPlayer} 
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-400 focus:outline-none appearance-none"
                >
                  <option value="">Choose a player...</option>
                  {playerNames.map(name => (
                    <option key={name} value={name.toLowerCase().replace('-', '')}>{name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {selectedPlayer && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Goals ⚽</label>
                    <input 
                      type="number" 
                      min="0"
                      disabled={players.find(p => p.id === selectedPlayer)?.weeklySubmitted}
                      className={`w-full p-3 rounded-lg border focus:outline-none ${
                        players.find(p => p.id === selectedPlayer)?.weeklySubmitted 
                          ? 'bg-gray-600 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700 border-gray-600 focus:border-green-400'
                      }`}
                      onChange={(e) => updatePlayerStats(selectedPlayer, 'goals', e.target.value)}
                      value={players.find(p => p.id === selectedPlayer)?.goals || 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Assists ⚡</label>
                    <input 
                      type="number" 
                      min="0"
                      disabled={players.find(p => p.id === selectedPlayer)?.weeklySubmitted}
                      className={`w-full p-3 rounded-lg border focus:outline-none ${
                        players.find(p => p.id === selectedPlayer)?.weeklySubmitted 
                          ? 'bg-gray-600 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700 border-gray-600 focus:border-blue-400'
                      }`}
                      onChange={(e) => updatePlayerStats(selectedPlayer, 'assists', e.target.value)}
                      value={players.find(p => p.id === selectedPlayer)?.assists || 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Saves 🧤</label>
                    <input 
                      type="number" 
                      min="0"
                      disabled={players.find(p => p.id === selectedPlayer)?.weeklySubmitted}
                      className={`w-full p-3 rounded-lg border focus:outline-none ${
                        players.find(p => p.id === selectedPlayer)?.weeklySubmitted 
                          ? 'bg-gray-600 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700 border-gray-600 focus:border-yellow-400'
                      }`}
                      onChange={(e) => updatePlayerStats(selectedPlayer, 'saves', e.target.value)}
                      value={players.find(p => p.id === selectedPlayer)?.saves || 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Form Status</label>
                    <select 
                      disabled={players.find(p => p.id === selectedPlayer)?.weeklySubmitted}
                      className={`w-full p-3 rounded-lg border focus:outline-none ${
                        players.find(p => p.id === selectedPlayer)?.weeklySubmitted 
                          ? 'bg-gray-600 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700 border-gray-600 focus:border-orange-400'
                      }`}
                      onChange={(e) => updatePlayerStats(selectedPlayer, 'form', e.target.value)}
                      value={players.find(p => p.id === selectedPlayer)?.form || 'fit'}
                    >
                      <option value="injured">🤕 Injured</option>
                      <option value="slightly_injured">😐 Slightly Injured</option>
                      <option value="fit">💪 Fit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Game Result 🏆</label>
                    <select 
                      disabled={players.find(p => p.id === selectedPlayer)?.weeklySubmitted}
                      className={`w-full p-3 rounded-lg border focus:outline-none ${
                        players.find(p => p.id === selectedPlayer)?.weeklySubmitted 
                          ? 'bg-gray-600 border-gray-500 cursor-not-allowed text-gray-400' 
                          : 'bg-gray-700 border-gray-600 focus:border-green-400'
                      }`}
                      onChange={(e) => updatePlayerStats(selectedPlayer, 'won', e.target.value === 'true')}
                      value={players.find(p => p.id === selectedPlayer)?.won ? 'true' : 'false'}
                    >
                      <option value="false">❌ Lost Game</option>
                      <option value="true">🏆 Won Game (+10 pts)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-center md:col-span-2">
                  <button
                    onClick={() => {
                      const player = players.find(p => p.id === selectedPlayer);
                      if (player && !player.weeklySubmitted) {
                        setPlayers(prev => prev.map(p => 
                          p.id === selectedPlayer ? { ...p, weeklySubmitted: true } : p
                        ));
                        alert(`Stats submitted for ${player.name}! ✅`);
                      } else if (player?.weeklySubmitted) {
                        alert('This player has already submitted stats for this week! 🚫');
                      }
                    }}
                    disabled={!selectedPlayer || players.find(p => p.id === selectedPlayer)?.weeklySubmitted}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                      !selectedPlayer || players.find(p => p.id === selectedPlayer)?.weeklySubmitted
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                    }`}
                  >
                    {selectedPlayer && players.find(p => p.id === selectedPlayer)?.weeklySubmitted 
                      ? '✅ Already Submitted' 
                      : '🚀 Submit Stats'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-green-500/20">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-green-400" />
            Player Rankings
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Player</th>
                  <th className="text-center p-3">⚽ Goals</th>
                  <th className="text-center p-3">⚡ Assists</th>
                  <th className="text-center p-3">🧤 Saves</th>
                  <th className="text-center p-3">📊 Rating</th>
                  <th className="text-center p-3">🏆 Game</th>
                  <th className="text-center p-3">📊 Total</th>
                  <th className="text-center p-3">Form</th>
                </tr>
              </thead>
              <tbody>
                {getRankedPlayers().map((player, index) => (
                  <tr key={player.id} className={`border-b border-gray-700/50 ${index < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : ''}`}>
                    <td className="p-3 font-bold text-lg">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && (index + 1)}
                    </td>
                    <td className="p-3 font-semibold text-blue-300">
                      {player.name}
                      {player.currentBadges && player.currentBadges.length > 0 && (
                        <span className="ml-2">
                          {player.currentBadges.map((badge, idx) => (
                            <span key={idx} className="animate-pulse">{badge}</span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="text-center p-3 text-green-400">{player.goals}</td>
                    <td className="text-center p-3 text-blue-400">{player.assists}</td>
                    <td className="text-center p-3 text-yellow-400">{player.saves}</td>
                    <td className="text-center p-3 text-purple-400">{player.rating}</td>
                    <td className="text-center p-3">
                      {player.won ? '🏆 Won' : '❌ Lost'}
                    </td>
                    <td className="text-center p-3 font-bold text-orange-400">{player.totalPoints}</td>
                    <td className="text-center p-3">
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

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-yellow-500/20">
          <h3 className="text-2xl font-bold mb-4 text-center text-yellow-400">
            🏆 Current Leaders 🏆
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-4 rounded-xl">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-semibold text-purple-300">Overall Leader</div>
              <div className="text-lg text-white">
                {(() => {
                  const leader = getRankedPlayers()[0];
                  return leader && leader.totalPoints > 0 ? leader.name : 'No leader yet';
                })()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 p-4 rounded-xl">
              <div className="text-2xl mb-2">⚽️</div>
              <div className="font-semibold text-green-300">Top Scorer</div>
              <div className="text-lg text-white">
                {(() => {
                  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];
                  return topScorer && topScorer.goals > 0 ? `${topScorer.name} (${topScorer.goals})` : 'No goals yet';
                })()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 p-4 rounded-xl">
              <div className="text-2xl mb-2">⚡️</div>
              <div className="font-semibold text-blue-300">Top Assists</div>
              <div className="text-lg text-white">
                {(() => {
                  const topAssists = [...players].sort((a, b) => b.assists - a.assists)[0];
                  return topAssists && topAssists.assists > 0 ? `${topAssists.name} (${topAssists.assists})` : 'No assists yet';
                })()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 p-4 rounded-xl">
              <div className="text-2xl mb-2">🎖️</div>
              <div className="font-semibold text-yellow-300">Top Saves</div>
              <div className="text-lg text-white">
                {(() => {
                  const topSaves = [...players].sort((a, b) => b.saves - a.saves)[0];
                  return topSaves && topSaves.saves > 0 ? `${topSaves.name} (${topSaves.saves})` : 'No saves yet';
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-cyan-500/20">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-cyan-400" />
            Generate Balanced Teams
          </h3>
          
          <div className="grid md:grid-cols-4 gap-2 mb-6">
            {playerNames.map(name => {
              const playerId = name.toLowerCase().replace('-', '');
              return (
                <label key={name} className="flex items-center p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
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
                    className="mr-2"
                  />
                  <span className="text-sm">{name}</span>
                </label>
              );
            })}
          </div>

          <div className="text-center mb-4">
            <p className="text-gray-400 mb-2">Selected: {selectedPlayers.length} players</p>
            <button
              onClick={generateTeams}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Generate Teams ⚽
            </button>
          </div>

          {showTeams && generatedTeams.length === 2 && (
            <div className="grid md:grid-cols-2 gap-6">
              {generatedTeams.map((team, teamIndex) => (
                <div key={teamIndex} className={`p-4 rounded-lg ${teamIndex === 0 ? 'bg-red-900/30 border border-red-500/50' : 'bg-blue-900/30 border border-blue-500/50'}`}>
                  <h4 className="text-xl font-bold mb-3 text-center">
                    Team {teamIndex === 0 ? 'Red' : 'Blue'} {teamIndex === 0 ? '🔴' : '🔵'}
                  </h4>
                  {team.map((player: any) => (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-gray-800/50 rounded mb-2">
                      <span>{player.name}</span>
                      <span className="text-sm text-gray-400">
                        {calculateTotalPoints(player)} pts
                        {player.form === 'injured' && ' 🤕'}
                        {player.form === 'slightly_injured' && ' 😐'}
                        {player.form === 'fit' && ' 💪'}
                      </span>
                    </div>
                  ))}
                  <div className="text-center mt-3 font-bold">
                    Total: {team.reduce((sum: number, player: any) => sum + calculateTotalPoints(player), 0)} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scoring System & Prizes - NOW AT THE BOTTOM */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-indigo-300">
            <Shield className="w-6 h-6 mr-2" />
            Scoring System & Prizes
          </h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            {/* Point System */}
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 p-4 rounded-xl">
              <h4 className="font-bold text-cyan-300 mb-3">📊 Point System</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>⚽ Goal:</span>
                  <span className="text-green-400 font-semibold">5 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>⚡ Assist:</span>
                  <span className="text-blue-400 font-semibold">3 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>🧤 Save:</span>
                  <span className="text-yellow-400 font-semibold">2 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>🏆 Win Game:</span>
                  <span className="text-orange-400 font-semibold">10 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>📊 Rating:</span>
                  <span className="text-purple-400 font-semibold">Variable</span>
                </div>
              </div>
            </div>

            {/* Weekly Prizes */}
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 p-4 rounded-xl">
              <h4 className="font-bold text-emerald-300 mb-3">🏆 Weekly Awards</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span>⚽ Top Scorer</span>
                </div>
                <div className="flex items-center">
                  <span>⚡ Top Assists</span>
                </div>
                <div className="flex items-center">
                  <span>🎖️ Top Saves</span>
                </div>
                <div className="flex items-center">
                  <span>🏆 All Rounder</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * Badges reset every Thursday at 8PM
              </p>
            </div>

            {/* Monthly Prizes */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-4 rounded-xl">
              <h4 className="font-bold text-pink-300 mb-3">🌟 Monthly Awards</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span>⚽ Top Scorer</span>
                </div>
                <div className="flex items-center">
                  <span>☄️ Top Assists</span>
                </div>
                <div className="flex items-center">
                  <span>🧤 Top Saves</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * Badges remain for entire month
              </p>
            </div>

            {/* 4-Month Prizes */}
            <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 p-4 rounded-xl">
              <h4 className="font-bold text-yellow-300 mb-3">👑 4-Month Legends</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span>🏆💥 Ballon D&apos;or</span>
                </div>
                <div className="text-xs text-gray-300">(Overall Highest Score)</div>
                <div className="flex items-center mt-2">
                  <span>⚽⚽⚽ Top Scorer</span>
                </div>
                <div className="flex items-center">
                  <span>☄️☄️☄️ Top Assists</span>
                </div>
                <div className="flex items-center">
                  <span>🎖️🎖️🎖️ Top Saves</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * Ultimate prestige badges
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <p className="text-center text-gray-300 text-sm">
              <span className="font-semibold text-yellow-400">🎯 Pro Tip:</span> 
              Winning games gives the biggest point boost! Focus on teamwork to maximize your ranking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThursdayFootballApp;