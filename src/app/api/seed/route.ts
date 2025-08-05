import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Import team data
interface TeamData {
  name: string;
  member1Image: string;
  member2Image: string;
  table: string;
}

const teamData: TeamData[] = [
  {
    name: "Cuong Phan & Thanh Dang",
    member1Image: "/playerImages/Cuong Phan.png",
    member2Image: "/playerImages/Thanh Dang.png",
    table: "a",
  },
  {
    name: "Khoa Le & Cong Nguyen",
    member1Image: "/playerImages/Khoa Le.png",
    member2Image: "/playerImages/Cong Nguyen.png",
    table: "a",
  },
  {
    name: "Khanh Huynh & Han Ho",
    member1Image: "/playerImages/Khanh Huynh.png",
    member2Image: "/playerImages/Han Ho.png",
    table: "a",
  },
  {
    name: "Yen Dang & Minh Van",
    member1Image: "/playerImages/Yen Dang.png",
    member2Image: "/playerImages/Minh Van.png",
    table: "a",
  },
  {
    name: "Ha Trinh & Nhat Tran",
    member1Image: "/playerImages/Ha Trinh.png", 
    member2Image: "/playerImages/Nhat Tran.png",
    table: "b"
  },
  {
    name: "Duc Vo & Vu Truong",
    member1Image: "/playerImages/Duc Vo.png",
    member2Image: "/playerImages/Vu Truong.png", 
    table: "b"
  },
  {
    name: "Son Huynh & Sang Truong",
    member1Image: "/playerImages/Son Huynh.png",
    member2Image: "/playerImages/Sang Truong.png",
    table: "b"
  },
  {
    name: "Quyen Phan & Thanh Vo",
    member1Image: "/playerImages/Quyen Phan.png",
    member2Image: "/playerImages/Thanh Vo.png",
    table: "b"
  },
  {
    name: "Cuong Nguyen & Tri Phan",
    member1Image: "/playerImages/Cuong Nguyen.png",
    member2Image: "/playerImages/Tri Phan.png",
    table: "c"
  },
  {
    name: "Khoa Nguyen & Khuong Hoang", 
    member1Image: "/playerImages/Khoa Nguyen.png",
    member2Image: "/playerImages/Khuong Hoang.png",
    table: "c"
  },
  {
    name: "Lam Nguyen & Linh Pham",
    member1Image: "/playerImages/Lam Nguyen.png",
    member2Image: "/playerImages/Linh Pham.png",
    table: "c"
  },
  {
    name: "Dung Huynh & Hoan Hoang",
    member1Image: "/playerImages/Dung Huynh.png",
    member2Image: "/playerImages/Hoan Hoang.png",
    table: "c"
  }
];

export async function POST(request: NextRequest) {
  try {
    // Check for a secret key to prevent unauthorized seeding
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');
    
    // You can set this environment variable in Vercel
    const expectedKey = process.env.SEED_SECRET_KEY || 'your-secret-key-here';
    
    if (secretKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid secret key' },
        { status: 401 }
      );
    }

    console.log('Starting database seeding...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@company.com' },
      update: {},
      create: {
        email: 'admin@company.com',
        password: hashedPassword,
        name: 'Tournament Admin',
      },
    });

    console.log('Admin user created/updated:', admin.email);

    // Create tournament stage
    const tournamentStage = await prisma.tournamentStage.upsert({
      where: { id: 'default-stage' },
      update: {},
      create: {
        id: 'default-stage',
        currentStage: 'GROUP_STAGE',
        groupStageCompleted: false,
        knockoutGenerated: false,
      },
    });

    console.log('Tournament stage created/updated');

    // Create tournament tables
    const tables = ['a', 'b', 'c'];
    const createdTables = [];

    for (const tableName of tables) {
      const table = await prisma.tournamentTable.upsert({
        where: { name: `Table ${tableName.toUpperCase()}` },
        update: {},
        create: {
          name: `Table ${tableName.toUpperCase()}`,
          description: `Tournament table ${tableName.toUpperCase()}`,
        },
      });
      createdTables.push(table);
    }

    console.log('Tournament tables created/updated');

      // Create teams
  const teams = [];
  for (const teamInfo of teamData) {
    const table = createdTables.find(t => t.name === `Table ${teamInfo.table.toUpperCase()}`);
    if (!table) {
      console.error(`Table ${teamInfo.table} not found`);
      continue;
    }

    const team = await prisma.team.upsert({
      where: {
        name_tournamentTableId: {
          name: teamInfo.name,
          tournamentTableId: table.id,
        },
      },
      update: {
        member1Image: teamInfo.member1Image,
        member2Image: teamInfo.member2Image,
      },
      create: {
        name: teamInfo.name,
        member1Image: teamInfo.member1Image,
        member2Image: teamInfo.member2Image,
        tournamentTableId: table.id,
      },
    });

    teams.push(team);
    console.log(`Team created/updated: ${team.name}`);
  }

  // Create initial match schedules for each table
  console.log('Creating group stage matches...');
  const today = new Date();
  const matchDates = [];
  
  // Generate match dates for the next 2 weeks
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    matchDates.push(date);
  }

  let matchDateIndex = 0;
  let totalMatchesCreated = 0;

  for (const table of createdTables) {
    const tableTeams = teams.filter(team => team.tournamentTableId === table.id);
    
    // Create round-robin matches (each team plays every other team once)
    for (let i = 0; i < tableTeams.length; i++) {
      for (let j = i + 1; j < tableTeams.length; j++) {
        const matchDate = new Date(matchDates[matchDateIndex % matchDates.length]);
        
        // Set random time between 9 AM and 6 PM
        const hour = 9 + Math.floor(Math.random() * 9);
        const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes
        matchDate.setHours(hour, minute, 0, 0);

        const match = await prisma.match.create({
          data: {
            tournamentTableId: table.id,
            homeTeamId: tableTeams[i].id,
            awayTeamId: tableTeams[j].id,
            scheduledAt: matchDate,
            status: 'SCHEDULED',
            format: Math.random() > 0.7 ? 'BO5' : 'BO3', // 30% BO5, 70% BO3
            matchType: 'GROUP_STAGE',
          },
        });
        
        console.log(`Created match: ${tableTeams[i].name} vs ${tableTeams[j].name} at ${matchDate.toLocaleString()}`);
        matchDateIndex++;
        totalMatchesCreated++;
      }
    }
  }

  // Create some completed group stage matches for demonstration
  console.log('Completing some matches for demonstration...');
  const completedMatches = await prisma.match.findMany({
    where: { matchType: 'GROUP_STAGE' },
    take: 6, // Complete first 6 group stage matches
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  let completedMatchesCount = 0;

  for (const match of completedMatches) {
    const maxGames = match.format === 'BO5' ? 5 : 3;
    const requiredWins = match.format === 'BO5' ? 3 : 2;
    
    let homeGamesWon = 0;
    let awayGamesWon = 0;
    let totalHomePoints = 0;
    let totalAwayPoints = 0;
    let gameNumber = 1;

    // Simulate games until one team wins the required number
    while (homeGamesWon < requiredWins && awayGamesWon < requiredWins && gameNumber <= maxGames) {
      // Generate realistic table tennis scores (11-21 points, win by 2)
      let homeScore = Math.floor(Math.random() * 11) + 11; // 11-21
      let awayScore = Math.floor(Math.random() * 11) + 11; // 11-21
      
      // Ensure one team wins by at least 2 points
      if (Math.abs(homeScore - awayScore) < 2) {
        if (Math.random() > 0.5) {
          homeScore = Math.max(homeScore, awayScore) + 2;
        } else {
          awayScore = Math.max(homeScore, awayScore) + 2;
        }
      }
      
      // Make sure scores are realistic (11+ and win by 2)
      if (homeScore >= 11 && awayScore >= 11) {
        if (homeScore === awayScore) {
          homeScore += Math.random() > 0.5 ? 2 : 0;
          awayScore += homeScore > awayScore ? 0 : 2;
        }
      } else {
        // Ensure minimum score of 11 for winner
        if (homeScore > awayScore) {
          homeScore = Math.max(homeScore, 11);
        } else {
          awayScore = Math.max(awayScore, 11);
        }
      }

      // Create the game
      await prisma.game.create({
        data: {
          matchId: match.id,
          gameNumber: gameNumber,
          homeScore: homeScore,
          awayScore: awayScore,
          status: 'COMPLETED',
          completedAt: new Date(match.scheduledAt.getTime() + gameNumber * 10 * 60 * 1000), // 10 minutes per game
        },
      });

      // Update counters
      if (homeScore > awayScore) {
        homeGamesWon++;
      } else {
        awayGamesWon++;
      }
      
      totalHomePoints += homeScore;
      totalAwayPoints += awayScore;
      gameNumber++;
    }

    // Update the match with final results
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeGamesWon: homeGamesWon,
        awayGamesWon: awayGamesWon,
        homeScore: totalHomePoints,
        awayScore: totalAwayPoints,
        status: 'COMPLETED',
        completedAt: new Date(match.scheduledAt.getTime() + 30 * 60 * 1000), // 30 minutes after scheduled
      },
    });

    // Update team stats
    const homeWin = homeGamesWon > awayGamesWon;
    
    await prisma.team.update({
      where: { id: match.homeTeamId },
      data: {
        matchesPlayed: { increment: 1 },
        wins: homeWin ? { increment: 1 } : undefined,
        losses: homeWin ? undefined : { increment: 1 },
        points: { increment: totalHomePoints },
        pointsAgainst: { increment: totalAwayPoints },
      },
    });

    await prisma.team.update({
      where: { id: match.awayTeamId },
      data: {
        matchesPlayed: { increment: 1 },
        wins: homeWin ? undefined : { increment: 1 },
        losses: homeWin ? { increment: 1 } : undefined,
        points: { increment: totalAwayPoints },
        pointsAgainst: { increment: totalHomePoints },
      },
    });

    console.log(`Completed ${match.format} match: ${match.homeTeam.name} ${homeGamesWon} - ${awayGamesWon} ${match.awayTeam.name} (${totalHomePoints}-${totalAwayPoints} points)`);
    completedMatchesCount++;
  }

  console.log('Database seeding completed successfully!');

  return NextResponse.json({
    success: true,
    message: 'Database seeded successfully',
    adminEmail: admin.email,
    adminPassword: 'admin123', // Only return this in development
    teamsCreated: teamData.length,
    matchesCreated: totalMatchesCreated,
    matchesCompleted: completedMatchesCount,
  });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET method to check if seeding is available
export async function GET() {
  return NextResponse.json({
    message: 'Seed endpoint is available. Use POST with ?key=your-secret-key to seed the database.',
    note: 'Make sure to set SEED_SECRET_KEY environment variable in Vercel for security.'
  });
} 