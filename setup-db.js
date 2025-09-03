const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://slxkyrqgxvekxrzcoiew.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseGt5cnFneHZla3hyemNvaWV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM2OTY1MSwiZXhwIjoyMDcwOTQ1NjUxfQ.rNVdOMkIXLEH7tarhlPfR08pMvTIAVrrmdcXq8RD9-Y'

// Create client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupDatabase() {
  console.log('Setting up Thursday Football League database...')
  
  try {
    // First, let's see what tables exist
    console.log('Checking existing tables...')
    
    // Try to list all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables')
    
    if (tablesError) {
      console.log('Cannot list tables, will check existing tables...')
      
      // Check if player_stats table exists (mentioned in error)
      const { data: playerStatsData, error: playerStatsError } = await supabase
        .from('player_stats')
        .select('*')
        .limit(5)
      
      if (!playerStatsError) {
        console.log('✓ Found existing player_stats table')
        console.log('Sample data:', playerStatsData)
        
        // Get table structure by looking at first record
        if (playerStatsData && playerStatsData.length > 0) {
          console.log('Table columns:', Object.keys(playerStatsData[0]))
        }
      } else {
        console.log('player_stats table check failed:', playerStatsError)
      }
      
      // Check for other possible tables and insert sample data to see structure
      const possibleTables = ['players', 'games', 'submissions', 'stats', 'weekly_stats']
      for (const tableName of possibleTables) {
        const { data, error } = await supabase.from(tableName).select('*').limit(1)
        if (!error) {
          console.log(`✓ Found table: ${tableName}`)
          if (data && data.length > 0) {
            console.log(`  Columns:`, Object.keys(data[0]))
            console.log(`  Sample data:`, data[0])
          } else {
            console.log(`  Table is empty`)
          }
        }
      }
      
      // Let's also try to insert a test record to see the expected structure
      console.log('\nTesting player_stats table structure...')
      const { data: insertTest, error: insertError } = await supabase
        .from('player_stats')
        .insert({
          name: 'Test Player',
          goals: 1,
          assists: 1,
          saves: 1,
          wins: 1
        })
        .select()
      
      if (insertError) {
        console.log('Insert test failed, trying different structure...')
        console.log('Error details:', insertError)
        
        // Try minimal structures to discover column names
        const testFields = [
          { id: 1 },
          { player_id: 1 },
          { name: 'Test' },
          { goals: 1 },
          { assists: 1 },
          { saves: 1 },
          { wins: 1 },
          { won: true },
          { game_date: '2025-08-24' },
          { date: '2025-08-24' },
          { form: 'fit' },
          { form_status: 'fit' }
        ]
        
        console.log('Testing complete record structure based on discovered constraints...')
        
        // Based on errors, the table needs: team (required), and supports goals/assists/saves
        const testRecord = {
          team: 'Test Team',
          player_name: 'Ahmed',
          goals: 2,
          assists: 1,
          saves: 0
        }
        
        const { data: fullTest, error: fullError } = await supabase
          .from('player_stats')
          .insert(testRecord)
          .select()
        
        if (!fullError) {
          console.log('✓ Successfully inserted test record!')
          console.log('✓ Table structure:', Object.keys(fullTest[0]))
          console.log('✓ Sample data:', fullTest[0])
          
          // Get the actual structure
          const actualStructure = fullTest[0]
          console.log('\n📋 DISCOVERED SCHEMA:')
          for (const [key, value] of Object.entries(actualStructure)) {
            console.log(`  ${key}: ${typeof value} (${value})`)
          }
          
          // Check games table structure too
          console.log('\n🎮 Checking games table structure...')
          const { data: gameTest, error: gameError } = await supabase
            .from('games')
            .insert({
              name: 'Test Game',
              date: '2025-08-24'
            })
            .select()
          
          if (!gameError) {
            console.log('✓ Games table structure:', Object.keys(gameTest[0]))
            console.log('✓ Games sample:', gameTest[0])
          } else {
            console.log('Games insert failed:', gameError)
            
            // Try minimal games structure
            const { data: minGame, error: minGameError } = await supabase
              .from('games')
              .insert({})
              .select()
            
            if (!minGameError) {
              console.log('✓ Minimal games structure:', Object.keys(minGame[0]))
            } else {
              console.log('Minimal games failed:', minGameError)
            }
          }
          
        } else {
          console.log('Full test failed:', fullError)
          
          // Try single character team and discover structure
          const minimalTest = {
            team: 'A'
          }
          
          const { data: minData, error: minError } = await supabase
            .from('player_stats')
            .insert(minimalTest)
            .select()
          
          if (!minError) {
            console.log('✓ Minimal insert worked:', minData[0])
            console.log('✓ Discovered structure:', Object.keys(minData[0]))
            
            // Try adding more fields based on what exists
            const { data: moreData, error: moreError } = await supabase
              .from('player_stats')
              .insert({
                team: 'B',
                goals: 2,
                assists: 1,
                saves: 0
              })
              .select()
            
            if (!moreError) {
              console.log('✓ Extended structure works:', Object.keys(moreData[0]))
              console.log('✓ Full record:', moreData[0])
            } else {
              console.log('Extended structure failed:', moreError)
            }
            
          } else {
            console.log('Even minimal insert failed:', minError)
          }
        }
      } else {
        console.log('✓ Successfully inserted test data:', insertTest)
      }
    } else {
      console.log('Available tables:', tables)
    }
    
    console.log('Database investigation completed!')
    
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

setupDatabase()