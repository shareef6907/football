const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TEAM_MEMBERS = [
  'Ahmed', 'Fasin', 'Hamsheed', 'Jalal', 'Shareef', 'Shaheen', 
  'Emaad', 'Darwish', 'Luqman', 'Nabeel', 'Jinish', 'Afzal', 
  'Rathul', 'Madan', 'Waleed', 'Ahmed-Ateeq', 'Junaid', 
  'Shafeer', 'Fathah', 'Nithin'
]

const ADMIN_CREDENTIALS = {
  username: 'admin_captain',
  password: 'FootballStats2025!',
  email: 'admin@thursdayfootball.com',
  display_name: 'Captain Admin'
}

async function setupDatabase() {
  console.log('🚀 Setting up Thursday Football database...\n')

  try {
    // 1. Read and execute the schema SQL
    console.log('📊 Creating database schema...')
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    
    // Split the SQL into individual statements and execute them
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  SQL Warning: ${error.message}`)
        }
      }
    }
    console.log('✅ Database schema created successfully\n')

    // 2. Create admin user
    console.log('👑 Creating admin user...')
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      email_confirm: true,
      user_metadata: {
        username: ADMIN_CREDENTIALS.username,
        display_name: ADMIN_CREDENTIALS.display_name
      }
    })

    if (adminError && !adminError.message.includes('already registered')) {
      console.error('❌ Error creating admin user:', adminError)
    } else {
      console.log('✅ Admin user created successfully')
      
      // Insert admin into users table
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: adminUser?.user?.id || 'admin-id',
          username: ADMIN_CREDENTIALS.username,
          display_name: ADMIN_CREDENTIALS.display_name,
          email: ADMIN_CREDENTIALS.email,
          is_admin: true,
          total_points: 0
        })

      if (insertError) {
        console.warn('⚠️  Admin user profile warning:', insertError.message)
      }
    }

    // 3. Create sample team member accounts
    console.log('\n👥 Creating team member accounts...')
    let createdMembers = 0

    for (const member of TEAM_MEMBERS) {
      const email = `${member.toLowerCase().replace(/[^a-z]/g, '')}@thursdayfootball.com`
      const username = member.toLowerCase().replace(/[^a-z]/g, '_')
      
      try {
        const { data: memberUser, error: memberError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'TempPass123!', // They'll change this on first login
          email_confirm: true,
          user_metadata: {
            username: username,
            display_name: member
          }
        })

        if (memberError && !memberError.message.includes('already registered')) {
          console.warn(`⚠️  Could not create ${member}: ${memberError.message}`)
        } else {
          // Insert into users table
          const { error: insertError } = await supabase
            .from('users')
            .upsert({
              id: memberUser?.user?.id || `${username}-id`,
              username: username,
              display_name: member,
              email: email,
              is_admin: false,
              total_points: Math.floor(Math.random() * 50) // Random starting points for demo
            })

          if (!insertError) {
            createdMembers++
            console.log(`✅ Created account for ${member}`)
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error with ${member}:`, error.message)
      }
    }

    console.log(`\n🎉 Successfully created ${createdMembers} team member accounts`)

    // 4. Create some sample data
    console.log('\n📝 Creating sample data...')
    
    // Add some sample games
    const sampleGames = [
      {
        game_date: '2025-08-10',
        team_a_players: ['shareef-id', 'ahmed-id', 'jalal-id', 'hamsheed-id', 'fasin-id'],
        team_b_players: ['shaheen-id', 'emaad-id', 'darwish-id', 'luqman-id', 'nabeel-id'],
        team_a_score: 3,
        team_b_score: 2,
        winning_team: 'A',
        game_type: '5v5',
        verified: true
      },
      {
        game_date: '2025-08-03',
        team_a_players: ['jinish-id', 'afzal-id', 'rathul-id', 'madan-id', 'waleed-id'],
        team_b_players: ['ahmed_ateeq-id', 'junaid-id', 'shafeer-id', 'fathah-id', 'nithin-id'],
        team_a_score: 1,
        team_b_score: 4,
        winning_team: 'B',
        game_type: '5v5',
        verified: true
      }
    ]

    for (const game of sampleGames) {
      const { error: gameError } = await supabase
        .from('games')
        .insert(game)

      if (gameError) {
        console.warn('⚠️  Sample game warning:', gameError.message)
      }
    }

    console.log('✅ Sample data created')

    console.log('\n🎊 Database setup completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   • Database schema: ✅ Created`)
    console.log(`   • Admin account: ✅ ${ADMIN_CREDENTIALS.email} / ${ADMIN_CREDENTIALS.password}`)
    console.log(`   • Team members: ✅ ${createdMembers} accounts created`)
    console.log(`   • Sample data: ✅ 2 games with stats`)
    console.log('\n🚀 Your Thursday Football app is ready to go!')
    console.log('   Run: npm run dev')
    console.log('   Visit: http://localhost:3000/login')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Function to create SQL execution function in Supabase
async function createExecSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSql })
  if (error && !error.message.includes('already exists')) {
    // Try to create it directly
    const { error: directError } = await supabase
      .from('pg_proc')
      .select('*')
      .limit(1)

    // This is just to test connection, we'll handle SQL execution differently
  }
}

if (require.main === module) {
  setupDatabase()
}