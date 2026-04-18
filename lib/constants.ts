// Player roster with their existing UUIDs
export const PLAYERS = [
  { id: '7f1e43d8-80f0-49c6-84ac-6378af6de477', name: 'Ahmed', color: '#EF4444', position: 'forward' },
  { id: 'd58595c9-cb6c-4b9d-8158-523f6b893580', name: 'Fasin', color: '#F97316', position: 'midfielder' },
  { id: '6e3d931a-dc26-4b90-81f0-59ff53019e50', name: 'Hamsheed', color: '#EAB308', position: 'forward' },
  { id: '6c0ce954-87a5-41b2-8898-1330751155b0', name: 'Jalal', color: '#22C55E', position: 'defender' },
  { id: 'ba7c5acc-c94d-466e-8d5a-0c7773c2bf0c', name: 'Shareef', color: '#3B82F6', position: 'midfielder' },
  { id: '10825c4b-23d0-4e93-8c49-eadface5aeb3', name: 'Shaheen', color: '#8B5CF6', position: 'forward' },
  { id: 'ac54a34c-4448-4721-8442-5dde27973756', name: 'Emaad', color: '#EC4899', position: 'defender' },
  { id: 'df86a60e-5940-406a-8330-f74379c89da3', name: 'Luqman', color: '#14B8A6', position: 'midfielder' },
  { id: '3b16e4b3-82f5-4a0e-80d3-86f6b149891a', name: 'Nabeel', color: '#06B6D4', position: 'forward' },
  { id: '793fb65a-2b41-41d8-84d4-f4ab015c6aab', name: 'Jinish', color: '#F43F5E', position: 'midfielder' },
  { id: 'e30229fa-f9d5-4440-8dc4-471d213ffb6b', name: 'Shammas', color: '#84CC16', position: 'defender' },
  { id: 'd7a8e753-d98e-43d6-8c44-6eda18f32d4d', name: 'Rathul', color: '#A855F7', position: 'goalkeeper' },
  { id: '611a0a44-d1e2-40fe-8946-ba84e980a694', name: 'Madan', color: '#10B981', position: 'forward' },
  { id: '1b6a5f4a-c0e8-4694-83cb-4da00c20545e', name: 'Waleed', color: '#0EA5E9', position: 'midfielder' },
  { id: '149aedd7-a9a5-4810-8002-c67163cd5cf6', name: 'Raihan', color: '#F59E0B', position: 'defender' },
  { id: '1215383b-bbb7-43f3-8759-2f5b69994330', name: 'Junaid', color: '#6366F1', position: 'defender' },
  { id: 'dfea2af6-9ab5-4e88-8f0b-6860f83ae8ef', name: 'Shafeer', color: '#D946EF', position: 'goalkeeper' },
  { id: 'ae977a0c-cfb6-4827-87c9-f2448f03164e', name: 'Fathah', color: '#14B8A6', position: 'midfielder' },
  { id: '42c2e951-394b-4b32-8823-3b5f70d3a56d', name: 'Raed', color: '#F97316', position: 'forward' },
  { id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d', name: 'Ameen', color: '#22C55E', position: 'defender' },
  { id: '6c6b378f-2748-467a-8eca-62c782eacd0a', name: 'Darwish', color: '#3B82F6', position: 'defender' },
] as const

export type PlayerId = typeof PLAYERS[number]['id']
export type PlayerName = typeof PLAYERS[number]['name']

// Points system
export const POINTS_SYSTEM = {
  goal: 5,
  assist: 3,
  matchWin: 10,
  cleanSheet: 4,
  goalkeeperWinBonus: 5,
  attendance: 2,
  attendanceStreakBonus: 1,
  manOfTheMatch: 15,
} as const

// Coins are earned 1:1 with points
export const COIN_MULTIPLIER = 1

// Position types
export type Position = 'forward' | 'midfielder' | 'defender' | 'goalkeeper'

// Form status
export type FormStatus = 'fit' | 'injured' | 'slightly_injured'

// Team sizes available
export const TEAM_SIZES = [5, 6, 7, 8, 9, 10, 11] as const
export const NUM_TEAMS = [2, 3] as const