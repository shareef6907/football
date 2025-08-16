# CLAUDE.md - Thursday Football Complete Project Specification

## 🎯 Project Overview

**Thursday Football Club Management System** - A professional sports analytics platform for managing weekly football matches, player statistics, team formation, and performance tracking with monthly awards and achievements.

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase (PostgreSQL) with realtime capabilities
- **Styling**: Tailwind CSS with Hero.ui inspired components
- **Type Safety**: TypeScript strict mode
- **Animations**: Framer Motion with micro-interactions
- **Deployment**: Vercel (deployment ready)
- **PWA**: Progressive Web App capabilities

## 👥 Authentication & User Management

### Admin Controls
```javascript
{
  username: 'admin_captain',
  password: 'FootballStats2025!',
  email: 'admin@thursdayfootball.com'
}
```

### Predefined Team Members (20 total)
```javascript
['Ahmed', 'Fasin', 'Hamsheed', 'Jalal', 'Shareef', 'Shaheen', 
 'Emaad', 'Darwish', 'Luqman', 'Nabeel', 'Jinish', 'Afzal', 
 'Rathul', 'Madan', 'Waleed', 'Ahmed-Ateeq', 'Junaid', 
 'Shafeer', 'Fathah', 'Nithin']
```

### User Flow
1. New users MUST rate all players on first visit (anonymous)
2. Email/password registration with Supabase Auth
3. Dashboard access after authentication
4. Admin panel for captain with special controls

## 📊 Stats Tracking System

### Point Values
- **Goals**: 5 points each
- **Assists**: 3 points each  
- **Saves**: 2 points each
- **Team Win Bonus**: 5 points for ALL winning team members

### Stat Verification
- Requires **2+ confirmations** from other players
- Self-reported stats marked as "pending" until verified
- Admin can override/approve any stat

### Form Status (Self-Rating)
Players can set their current form:
- 🔴 **Injured** - Not available for selection
- 🟡 **Slightly Injured** - Can play with limitations
- 🟢 **Full Form** - Normal performance
- ⚡ **Peak Form** - Exceptional condition

## 🏆 Awards & Recognition

### Monthly Awards (Reset every 4 weeks)
1. **Player of the Month** 
   - 🥇 Gold medal icon
   - Display win count
   - Based on total points

2. **Top Goal Scorer**
   - ⚽ Football icon
   - Display win count
   - Most goals in the month

3. **Most Assists**
   - 🥈 Silver medal icon
   - Display win count
   - Most assists in the month

### Achievement System
- **Streak Achievements**: "5 goals in a row", "10 game win streak"
- **Milestone Achievements**: "100 career goals", "50 assists"
- **Special Achievements**: "Hat-trick hero", "Clean sheet specialist"
- Permanent badges displayed on profile

## ⚽ Team Creation & Balancing

### Team Generator Features
- **5-a-side** team generator
- **6-a-side** team generator
- Switch between formats easily

### Auto-Balancing Algorithm
```
Team Score = Σ(Player Points × 0.5 + Peer Rating × 0.3 + Form Status × 0.2)
```
- Considers total points from stats
- Factors in peer ratings
- Adjusts for current form status
- Ensures balanced team strengths

### Team History Tracking
- Win rates for each combination
- Best performing lineups
- Historical team performance
- Suggested "dream teams" based on data

## ⭐ Rating System

### Monthly Peer Ratings
- **Scale**: 1-10 (10 being excellent)
- **Reset**: Every 4 weeks
- **Anonymous**: Ratings are private
- **Required**: New users must complete before access

### Rating Rules
- Cannot rate yourself
- Can update ratings once per week
- Ratings affect team balancing
- Historical ratings tracked

## 📈 Dashboard & Analytics

### Weekly Progress
- Current week stats vs previous week
- Progress bars for goals/assists/saves
- Win/loss ratio
- Form status indicator

### Monthly vs All-Time Stats
- Toggle between monthly and career stats
- Comparison charts
- Percentile rankings
- Achievement progress

### Live Leaderboards
- Real-time updates
- Countdown to monthly reset
- Filter by: Points, Goals, Assists, Saves, Wins
- Mobile swipe navigation

### Export Functionality
- Monthly summaries (PDF/CSV)
- Yearly reports
- Share to social media
- Email reports to players

## 📱 Design Requirements

### Theme
- **Primary**: Dark theme (black/gray-950)
- **Accent Colors**: Vibrant but professional
  - Blue-500 (primary actions)
  - Green-400 (success/wins)
  - Yellow-400 (achievements)
  - Red-400 (losses/errors)

### Hero.ui Inspired Components
- Glassmorphism cards
- Smooth gradients
- Backdrop blur effects
- Professional typography

### Animations & Micro-interactions
- Page transitions (300ms)
- Hover effects on all interactive elements
- Loading skeletons
- Success animations for achievements
- Smooth number counters

### Mobile Optimization
- **Mobile-first** responsive design
- Touch-optimized controls
- Swipe gestures for navigation
- On-the-go stat logging
- Offline capability with sync

### PWA Capabilities
- Install prompt
- Offline mode
- Push notifications for:
  - Game reminders
  - Stat verification requests
  - Monthly award announcements
- Home screen icon

## 🗄️ Database Schema (Supabase)

### Tables

#### users
```sql
- id (uuid, primary key)
- email (text, unique)
- display_name (text)
- role (enum: player, admin)
- created_at (timestamp)
- avatar_url (text)
```

#### games
```sql
- id (uuid, primary key)
- date (date)
- type (enum: 5v5, 6v6)
- team_a (jsonb) -- player IDs
- team_b (jsonb) -- player IDs
- team_a_score (integer)
- team_b_score (integer)
- created_at (timestamp)
```

#### player_stats
```sql
- id (uuid, primary key)
- game_id (uuid, foreign key)
- player_id (uuid, foreign key)
- goals (integer)
- assists (integer)
- saves (integer)
- team_won (boolean)
- verified (boolean, default false)
- verified_by (jsonb) -- array of user IDs
- created_at (timestamp)
```

#### peer_ratings
```sql
- id (uuid, primary key)
- rater_id (uuid, foreign key)
- rated_player_id (uuid, foreign key)
- rating (integer, 1-10)
- month_year (text) -- "2025-01"
- created_at (timestamp)
```

#### monthly_awards
```sql
- id (uuid, primary key)
- month_year (text)
- player_of_month (uuid, foreign key)
- top_scorer (uuid, foreign key)
- most_assists (uuid, foreign key)
- created_at (timestamp)
```

#### teams
```sql
- id (uuid, primary key)
- game_id (uuid, foreign key)
- players (jsonb)
- total_points (integer)
- won (boolean)
- created_at (timestamp)
```

#### achievements
```sql
- id (uuid, primary key)
- player_id (uuid, foreign key)
- type (text)
- title (text)
- description (text)
- icon (text)
- earned_at (timestamp)
```

#### form_status
```sql
- id (uuid, primary key)
- player_id (uuid, foreign key)
- status (enum: injured, slightly_injured, full_form, peak_form)
- updated_at (timestamp)
```

## 🎮 Sample Data

### Previous Games (2 games)
```javascript
Game 1 (Last Thursday):
- Team A wins 5-3
- Shareef: 2 goals, 1 assist
- Ahmed: 1 goal, 2 assists
- Nabeel: 3 saves (GK)

Game 2 (2 weeks ago):
- Team B wins 4-4 (penalties)
- Jalal: 3 goals
- Fasin: 2 assists
- Luqman: 5 saves (GK)
```

### Pre-populated Achievements
- Shareef: "Hat-trick Hero", "10 Game Streak"
- Ahmed: "Assist Master", "Team Player"
- Nabeel: "Clean Sheet Specialist"

### Initial Ratings
- All players start with 5.0 average rating
- Some players have 10-15 ratings already

## 🚀 Deployment Configuration

### Vercel Settings
```yaml
Framework: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
Root Directory: thursday-football
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# App Config
NEXT_PUBLIC_APP_URL=https://thursdayfootball.com
NEXT_PUBLIC_MONTHLY_RESET_DAYS=28
```

## ✅ Implementation Checklist

### Phase 1: Core Features
- [ ] Supabase setup with all tables
- [ ] Authentication system
- [ ] Player rating system
- [ ] Basic dashboard
- [ ] Stats recording

### Phase 2: Advanced Features
- [ ] Team generator with balancing
- [ ] Stat verification system
- [ ] Monthly awards
- [ ] Achievement system
- [ ] Form status tracking

### Phase 3: Polish
- [ ] PWA implementation
- [ ] Export functionality
- [ ] Push notifications
- [ ] Social sharing
- [ ] Advanced analytics

### Phase 4: Optimization
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] A/B testing
- [ ] User feedback system
- [ ] Admin panel enhancements

## 📋 User Stories

1. **As a player**, I want to log my stats after each game
2. **As a player**, I want to see my ranking and progress
3. **As a captain**, I want to generate balanced teams
4. **As a player**, I want to track my achievements
5. **As a player**, I want to rate my teammates anonymously
6. **As a captain**, I want to verify reported stats
7. **As a player**, I want to export my yearly summary
8. **As a player**, I want to set my availability/form status

## 🔐 Security Requirements

- Row Level Security (RLS) on all Supabase tables
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure session management
- HTTPS only
- Environment variables for sensitive data
- Regular security audits

## 📱 Mobile App Considerations

- Touch-friendly UI (minimum 44px touch targets)
- Swipe gestures for navigation
- Pull-to-refresh on leaderboards
- Optimized images and lazy loading
- Offline queue for stat submissions
- Background sync when online

## 🎨 Branding Guidelines

- **Logo**: Trophy icon with "TF" text
- **Colors**: Dark theme with blue/purple gradients
- **Typography**: Inter or system fonts
- **Tone**: Professional yet friendly
- **Language**: English (with potential for Arabic support)

---

**Version**: 2.0.0
**Last Updated**: January 2025
**Maintained By**: Thursday Football Development Team
**Domain**: thursdayfootball.com