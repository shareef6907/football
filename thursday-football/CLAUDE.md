# CLAUDE.md - Thursday Football Project Guidelines

## 🎯 Project Overview

**Thursday Football Club Management System** - A professional sports analytics platform for managing weekly football matches, player statistics, and team performance.

### Tech Stack
- **Framework**: Next.js 15.4.6 with TypeScript
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React (Professional icons only - NO EMOJIS in UI)
- **Deployment**: Vercel
- **Domain**: thursdayfootball.com

### Repository
- **GitHub**: shareef6907/football
- **Branch**: main
- **Auto-deploy**: Enabled on push

## 🎨 Design Philosophy

### Million-Dollar App Aesthetic
- **Theme**: Pure black backgrounds with gray-950 accents
- **No childish elements**: No emojis, cartoon icons, or bright neon colors
- **Professional only**: Corporate sports analytics platform appearance
- **Typography**: Clean, modern, sans-serif fonts
- **Spacing**: Generous padding and margins for premium feel

### Color Palette
```css
- Background: black, gray-950
- Cards: gray-950/50 with backdrop-blur
- Borders: gray-800
- Text Primary: white
- Text Secondary: gray-400, gray-500
- Accents: blue-500, purple-600 (gradients)
- Success: green-400
- Warning: yellow-400
- Error: red-400
```

### UI Patterns
- **Glassmorphism**: backdrop-blur-xl with semi-transparent backgrounds
- **Smooth animations**: Framer Motion with 200-600ms transitions
- **Hover states**: All interactive elements must have hover effects
- **Professional icons**: Lucide React icons only
- **No emojis**: Zero emojis in the application UI

## ⚡ Core Features

### 1. Player Rating System
- **Scale**: 1-10 stars (1 = Poor, 10 = Excellent)
- **Access**: No login required for initial rating
- **UI**: Golden stars with fill animation when selected
- **Storage**: localStorage with key 'playerRatings'
- **Completion**: Redirects to rankings page after all players rated

### 2. Rankings Page
- **Points Calculation Formula**:
  ```
  Total Points = (Rating × 10) + (Goals × 5) + (Assists × 3) + (Saves × 2) + (Wins × 4)
  ```
- **Features**:
  - Top 3 podium with special badges
  - Complete leaderboard table
  - Rank change indicators (trending up/down)
  - Professional dark theme

### 3. Match Recording System
- **Stats Tracked**:
  - Goals scored
  - Assists
  - Saves (for goalkeepers)
  - Match result (Win/Loss)
- **Storage**: localStorage with key 'matchData'
- **Access**: Available from dashboard after login

### 4. Dashboard
- **Professional Layout**:
  - Dark glassmorphism cards
  - Performance metrics
  - Match recording form
  - Navigation to rankings
- **Stats Display**:
  - Goals, Assists, Saves totals
  - Win/Loss record
  - Games played
  - Win rate percentage
  - Goals per game average

## 🔄 User Flow

```
1. Landing Page (5 seconds auto-redirect)
   ↓
2. Rate Players Page (rate all 20 players)
   ↓
3. Rankings Page (view initial rankings)
   ↓
4. Login/Register
   ↓
5. Dashboard (record matches, view stats)
   ↔
6. Rankings (accessible from dashboard)
```

### Key Navigation Rules
- First-time visitors MUST rate players before account creation
- Landing page auto-redirects after 5 seconds
- After rating completion → Rankings (not login)
- Dashboard has quick access to Rankings
- Logout returns to login page

## 👥 Team Members

### Predefined Players (20 total)
```javascript
['Ahmed', 'Fasin', 'Hamsheed', 'Jalal', 'Shareef', 'Shaheen', 
 'Emaad', 'Darwish', 'Luqman', 'Nabeel', 'Jinish', 'Afzal', 
 'Rathul', 'Madan', 'Waleed', 'Ahmed-Ateeq', 'Junaid', 
 'Shafeer', 'Fathah', 'Nithin']
```

### Display Rules
- **Always sort alphabetically** in dropdowns and lists
- Names are case-sensitive
- No nicknames or abbreviations

## 💾 Data Management

### localStorage Keys
- `playerRatings`: Array of {name, rating} objects
- `matchData`: Object with player stats by name

### Data Structure
```javascript
// Player Ratings
[{name: "Ahmed", rating: 8}, ...]

// Match Data
{
  "PlayerName": {
    goals: 5,
    assists: 3,
    saves: 0,
    wins: 2,
    losses: 1,
    gamesPlayed: 3
  }
}
```

### Supabase Configuration
- **Required Environment Variables**:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY (optional)
  ```

## 🛠️ Development Guidelines

### Commands
```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting (warnings don't block build)
npm run lint
```

### Project Structure
```
thursday-football/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── rate-players/         # Rating system
│   │   ├── rankings/             # Leaderboard
│   │   ├── login/                # Authentication
│   │   ├── register/             # User registration
│   │   └── dashboard/            # User dashboard
│   └── lib/
│       ├── auth.ts               # Supabase client
│       └── supabase.ts           # DB queries
├── public/                       # Static assets
└── CLAUDE.md                     # This file
```

### Configuration Files
- **next.config.ts**: ESLint ignoreDuringBuilds: true
- **Root Directory**: Set to 'thursday-football' in Vercel
- **Node Version**: 22.x

## 🚀 Deployment

### Vercel Settings
- **Framework Preset**: Next.js
- **Root Directory**: thursday-football
- **Build Command**: npm run build
- **Output Directory**: .next

### Domain Configuration
- **Primary**: thursdayfootball.com
- **DNS**: Managed through Vercel nameservers
- **SSL**: Automatic via Vercel

### Environment Variables (Vercel)
Must be set in Vercel dashboard:
1. NEXT_PUBLIC_SUPABASE_URL
2. NEXT_PUBLIC_SUPABASE_ANON_KEY
3. SUPABASE_SERVICE_ROLE_KEY (Production only)

## ✅ Quality Standards

### Code Quality
- TypeScript strict mode
- ESLint configured (warnings allowed in production)
- Component-based architecture
- Responsive design (mobile-first)

### Performance
- Lighthouse score target: >90
- Build size optimized with dynamic imports
- Images optimized and lazy-loaded
- Animations GPU-accelerated

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Contrast ratios WCAG AA compliant

## 🚫 What NOT to Do

1. **Never use emojis in the UI** (only in git commits)
2. **Never use bright neon colors** (maintain dark professional theme)
3. **Never skip the rating phase** for new users
4. **Never expose sensitive credentials** in code
5. **Never use relative paths** in imports (use @/ alias)
6. **Never ignore TypeScript errors** (fix them properly)
7. **Never commit directly to main** without testing
8. **Never use inline styles** (use Tailwind classes)

## 📝 Git Commit Convention

```
🎨 - UI/UX improvements
✨ - New features
🐛 - Bug fixes
🚀 - Performance improvements
📝 - Documentation
🔧 - Configuration changes
♻️ - Refactoring
```

## 🔐 Security Notes

- Admin credentials are stored in auth.ts (should be moved to env vars in production)
- Supabase Row Level Security (RLS) should be enabled
- API keys should never be committed to repository
- Use HTTPS only for all external requests

## 📊 Monitoring

- Vercel Analytics for performance monitoring
- Error tracking should be implemented
- User session tracking via Supabase
- Performance metrics in dashboard

---

**Last Updated**: January 2025
**Maintained By**: Thursday Football Development Team
**Version**: 1.0.0