# 🏓 Ping Pong Tournament Application

A modern Next.js application for managing company ping pong tournaments with standings, schedules, and admin features.

## 🚀 Features

### Tournament Management
- **3 Tournament Tables** with 4 teams each
- **Real-time Standings** with comprehensive team statistics
- **Match Scheduling** with Google-like design
- **Automatic Ranking System** based on match results
- **Admin Dashboard** for managing matches and results

### Key Statistics Tracked
- Matches Played, Wins, Losses
- Win Percentage
- Points For/Against and Point Differential
- Average Points Scored

### Responsive Design
- **Mobile-First Approach** with touch-friendly interfaces
- **Desktop-Optimized** tables and layouts
- **Adaptive Navigation** with mobile hamburger menu
- **Responsive Cards** for mobile match/standings display

### Admin Features
- **Secure Authentication** with NextAuth.js
- **Match Result Management** with real-time score updates
- **Team Statistics Auto-calculation** when matches are completed
- **Status Management** (Scheduled, In Progress, Completed, Cancelled)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Icons**: Lucide React
- **UI Components**: Radix UI primitives

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ping-pong-tournament
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ping_pong_tournament"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ADMIN_EMAIL="admin@company.com"
   ADMIN_PASSWORD="admin123"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Seed the database with sample data
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main App: `http://localhost:3000`
   - Admin Login: `http://localhost:3000/admin/login`
   - Default Admin Credentials: `admin@company.com` / `admin123`

## 📱 Application Structure

### Public Pages
- **`/`** - Tournament Standings (Home)
- **`/schedules`** - Match Schedules

### Admin Pages
- **`/admin/login`** - Admin Authentication
- **`/admin`** - Admin Dashboard (Protected)

### API Routes
- **`/api/standings`** - Get tournament standings
- **`/api/matches`** - Get match schedules with filters
- **`/api/matches/[id]`** - Update match results
- **`/api/auth/[...nextauth]`** - NextAuth.js authentication

## 🎯 Usage Guide

### For Participants
1. **View Standings**: Navigate to the home page to see current tournament rankings
2. **Check Schedules**: Visit `/schedules` to see upcoming and completed matches
3. **Filter Matches**: Use status and table filters to find specific matches

### For Admins
1. **Login**: Access `/admin/login` with admin credentials
2. **Manage Matches**: Edit match scores and statuses from the admin dashboard
3. **View Analytics**: Monitor tournament progress with quick stats
4. **Update Results**: Click edit icons to update match scores and completion status

## 🗄️ Database Schema

### Core Models
- **TournamentTable**: Represents the 3 tournament tables
- **Team**: 4 teams per table with performance statistics
- **Match**: Scheduled and completed matches with scores
- **Admin**: Administrative users with authentication

### Automatic Features
- **Team Statistics**: Auto-calculated when matches are completed
- **Ranking System**: Teams automatically ranked by wins, then points differential
- **Match Validation**: Ensures proper ping pong scoring (win by 2, minimum 21 points)

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

### Database Operations
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## 🎨 Design Decisions

### Mobile-First Responsive Design
- **Cards Layout**: Mobile uses card-based design for better touch interaction
- **Progressive Enhancement**: Desktop adds table layouts and additional columns
- **Touch-Friendly**: Larger tap targets and simplified navigation on mobile

### Google-Like Match Schedules
- **Date Grouping**: Matches grouped by date with clear visual separation
- **Status Indicators**: Color-coded status badges (Scheduled, Live, Final, Cancelled)
- **Team Information**: Shows team records alongside names
- **Score Display**: Prominent score display for completed matches

### Automatic Ranking Algorithm
1. **Primary**: Number of wins (descending)
2. **Secondary**: Total points scored (descending)  
3. **Tertiary**: Points against (ascending)

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **Protected Routes**: Admin pages require authentication
- **Session Management**: JWT-based sessions with NextAuth.js
- **Input Validation**: Server-side validation for all match updates

## 🚀 Deployment

### Environment Setup
Ensure production environment variables are configured:
- `DATABASE_URL` - Production PostgreSQL connection
- `NEXTAUTH_SECRET` - Strong secret for JWT signing
- `NEXTAUTH_URL` - Production URL

### Build Commands
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Create an issue in the repository
3. Contact the development team

---

Built with ❤️ for ping pong enthusiasts!