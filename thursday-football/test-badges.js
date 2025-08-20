// Test script for badge system
const { awardBallonDor, awardGoldenBoot, awardMonthlyBadge, getPlayerBadges } = require('./src/lib/awards.ts')

// Clear existing awards for testing
if (typeof localStorage !== 'undefined') {
  localStorage.clear()
}

console.log('🧪 Testing Badge System...\n')

// Test 1: Award Ballon d'Or to Shareef
console.log('1. Testing Ballon d\'Or award...')
try {
  awardBallonDor('Shareef')
  console.log('✅ Ballon d\'Or awarded to Shareef')
} catch (e) {
  console.log('❌ Error awarding Ballon d\'Or:', e.message)
}

// Test 2: Award Golden Boot to Ahmed  
console.log('2. Testing Golden Boot award...')
try {
  awardGoldenBoot('Ahmed')
  console.log('✅ Golden Boot awarded to Ahmed')
} catch (e) {
  console.log('❌ Error awarding Golden Boot:', e.message)
}

// Test 3: Award monthly badges
console.log('3. Testing monthly badges...')
try {
  awardMonthlyBadge('Fasin', 'topScorer')
  awardMonthlyBadge('Jalal', 'topAssists') 
  awardMonthlyBadge('Nabeel', 'topKeeper')
  console.log('✅ Monthly badges awarded')
} catch (e) {
  console.log('❌ Error awarding monthly badges:', e.message)
}

// Test 4: Get badges for each player
console.log('4. Testing badge retrieval...')
const players = ['Shareef', 'Ahmed', 'Fasin', 'Jalal', 'Nabeel']
players.forEach(player => {
  try {
    const badges = getPlayerBadges(player)
    console.log(`${player}: ${badges.join(' ') || 'No badges'}`)
  } catch (e) {
    console.log(`❌ Error getting badges for ${player}:`, e.message)
  }
})

console.log('\n🎯 Badge System Test Complete!')