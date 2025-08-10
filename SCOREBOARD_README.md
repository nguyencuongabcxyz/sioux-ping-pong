# Scoreboard Page - Sioux Ping Pong Tournament

## Overview
The Scoreboard page is a new admin-only feature that allows tournament administrators to record and manage match results in real-time. It provides a clean, modern interface for scoring matches with large, prominent score displays.

## Features

### 🔐 Admin-Only Access
- Only accessible to authenticated admin users
- Integrated with existing NextAuth authentication system
- Redirects non-admin users to login page

### 🏓 Match Selection
- Browse all scheduled matches with filtering options
- Filter by match status (Scheduled, In Progress, Completed, Cancelled)
- Filter by tournament table
- View match details including teams, format, and current scores

### 📊 Live Scoreboard
- **Large, prominent score display** - Current game scores are shown in large text (6xl font size)
- Real-time score updates with +/- buttons
- Support for both BO3 (Best of 3) and BO5 (Best of 5) formats
- Individual game scoring and status management
- Match summary showing total games won by each team

### 🎮 Game Management
- Track individual games within each match
- Set game status (Scheduled, In Progress, Completed)
- Increment/decrement scores with intuitive controls
- Automatic match completion detection based on format

### 💾 Data Persistence
- Integrates with existing match API endpoints
- Updates match results in real-time
- Automatically recalculates team statistics
- Maintains data consistency across the tournament system

## Navigation

The Scoreboard page is accessible through:
- **Desktop**: Admin section in main navigation (separated by divider)
- **Mobile**: Admin section in mobile menu (labeled "Admin")
- **Direct URL**: `/scoreboard`

## Usage

### 1. Access the Scoreboard
- Log in as an admin user
- Navigate to the Scoreboard page from the admin navigation

### 2. Select a Match
- Browse available matches using filters
- Click on any match to open the scoreboard interface

### 3. Record Scores
- Use the large +/- buttons to adjust scores
- Set game status (Scheduled → In Progress → Completed)
- Scores are updated in real-time

### 4. Save Results
- Click "Save Scores" to persist changes
- Match status automatically updates based on game results
- Team statistics are recalculated automatically

## Technical Implementation

### Components
- `ScoreboardPage` - Main page with authentication
- `ScoreboardComponent` - Core scoreboard functionality
- Integration with existing `Navigation` component

### API Integration
- Uses existing `/api/matches` endpoint for data fetching
- Uses existing `/api/matches/[id]` PATCH endpoint for updates
- Uses existing `/api/tables` endpoint for table filtering

### Data Models
- Leverages existing Prisma schema for `Match`, `Game`, `Team`, and `TournamentTable`
- Maintains consistency with existing tournament data structure

### Styling
- Built with Tailwind CSS
- Responsive design for desktop and mobile
- Consistent with existing tournament app design
- Orange theme matching tournament branding

## Security

- **Authentication Required**: Only accessible to authenticated admin users
- **Session Validation**: Uses NextAuth session management
- **Route Protection**: Automatic redirect for unauthorized access

## Browser Compatibility

- Modern browsers with ES6+ support
- Responsive design for mobile and desktop
- Optimized for tournament venue use (large touch targets)

## Future Enhancements

Potential improvements could include:
- Real-time updates using WebSockets
- Score validation rules
- Match timer integration
- Export functionality for tournament reports
- Integration with tournament bracket progression

## Troubleshooting

### Common Issues
1. **Page not accessible**: Ensure you're logged in as an admin
2. **Scores not saving**: Check network connection and try refreshing
3. **Match not appearing**: Verify match status and table filters

### Support
For technical issues, check the browser console for error messages and ensure all API endpoints are accessible.
