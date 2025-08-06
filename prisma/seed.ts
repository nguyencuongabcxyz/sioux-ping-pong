import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: hashedPassword,
      name: 'Tournament Admin',
    },
  })
  console.log('Created admin user:', admin.email)

  // Initialize tournament stage
  const tournamentStage = await prisma.tournamentStage.upsert({
    where: { id: 'tournament-stage' },
    update: {},
    create: {
      id: 'tournament-stage',
      currentStage: 'GROUP_STAGE',
      groupStageCompleted: false,
      knockoutGenerated: false,
    },
  })
  console.log('Initialized tournament stage:', tournamentStage.currentStage)

  // Create tournament tables with proper mapping
  const tableMapping = {
    'a': 'Table A',
    'b': 'Table B', 
    'c': 'Table C'
  }
  
  const tournamentTables = []

  for (const [letter, tableName] of Object.entries(tableMapping)) {
    const table = await prisma.tournamentTable.upsert({
      where: { name: tableName },
      update: {},
      create: {
        name: tableName,
        description: `Tournament ${tableName} for ping pong competition`,
      },
    })
    tournamentTables.push({ ...table, letter })
    console.log(`Created tournament table: ${table.name}`)
  }

  // Create teams using real team data
  const teams = []

  for (const teamInfo of teamData) {
    // Find the corresponding tournament table
    const tournamentTable = tournamentTables.find(t => t.letter === teamInfo.table)
    
    if (!tournamentTable) {
      console.error(`Could not find table for letter: ${teamInfo.table}`)
      continue
    }

    const team = await prisma.team.upsert({
      where: { 
        name_tournamentTableId: {
          name: teamInfo.name,
          tournamentTableId: tournamentTable.id
        }
      },
      update: {},
      create: {
        name: teamInfo.name,
        member1Image: teamInfo.member1Image,
        member2Image: teamInfo.member2Image,
        tournamentTableId: tournamentTable.id,
      },
    })
    teams.push(team)
    console.log(`Created team: ${team.name} in ${tournamentTable.name}`)
  }

  // Clear existing group stage matches before creating new ones
  console.log('Clearing existing group stage matches...')
  await prisma.game.deleteMany({
    where: {
      match: {
        matchType: 'GROUP_STAGE'
      }
    }
  })
  
  await prisma.match.deleteMany({
    where: {
      matchType: 'GROUP_STAGE'
    }
  })
  
  console.log('Existing group stage matches cleared')

  // Create initial match schedules for each table
  const today = new Date()
  const matchDates = []
  
  // Generate match dates for the next 2 weeks
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    matchDates.push(date)
  }

  // Define the tournament schedule pattern
  const tournamentSchedule = [
    // 11/8/2025: A: 12h30, A: 12h50, B: 5h30
    { date: 11, matches: [
      { tableIndex: 0, time: { hour: 12, minute: 30 } }, // Table A, 12:30 PM
      { tableIndex: 0, time: { hour: 12, minute: 50 } }, // Table A, 12:50 PM
      { tableIndex: 1, time: { hour: 17, minute: 30 } }  // Table B, 5:30 PM
    ]},
    // 12/8/2025: B: 12h30, C: 12h50, C: 5h30
    { date: 12, matches: [
      { tableIndex: 1, time: { hour: 12, minute: 30 } }, // Table B, 12:30 PM
      { tableIndex: 2, time: { hour: 12, minute: 50 } }, // Table C, 12:50 PM
      { tableIndex: 2, time: { hour: 17, minute: 30 } }  // Table C, 5:30 PM
    ]},
    // 13/8/2025: A: 12h30, A: 12h50, B: 5h30
    { date: 13, matches: [
      { tableIndex: 0, time: { hour: 12, minute: 30 } }, // Table A, 12:30 PM
      { tableIndex: 0, time: { hour: 12, minute: 50 } }, // Table A, 12:50 PM
      { tableIndex: 1, time: { hour: 17, minute: 30 } }  // Table B, 5:30 PM
    ]},
    // 14/8/2025: B: 12h30, C: 12h50, C: 5h30
    { date: 14, matches: [
      { tableIndex: 1, time: { hour: 12, minute: 30 } }, // Table B, 12:30 PM
      { tableIndex: 2, time: { hour: 12, minute: 50 } }, // Table C, 12:50 PM
      { tableIndex: 2, time: { hour: 17, minute: 30 } }  // Table C, 5:30 PM
    ]},
    // 15/8/2025: A: 12h30, A: 12h50, B: 5h30
    { date: 15, matches: [
      { tableIndex: 0, time: { hour: 12, minute: 30 } }, // Table A, 12:30 PM
      { tableIndex: 0, time: { hour: 12, minute: 50 } }, // Table A, 12:50 PM
      { tableIndex: 1, time: { hour: 17, minute: 30 } }  // Table B, 5:30 PM
    ]},
    // 18/8/2025: B: 12h30, C: 12h50, C: 5h30
    { date: 18, matches: [
      { tableIndex: 1, time: { hour: 12, minute: 30 } }, // Table B, 12:30 PM
      { tableIndex: 2, time: { hour: 12, minute: 50 } }, // Table C, 12:50 PM
      { tableIndex: 2, time: { hour: 17, minute: 30 } }  // Table C, 5:30 PM
    ]}
  ]

  // Create a proper round-robin schedule for each table
  const createRoundRobinSchedule = (teams: any[]) => {
    const schedule = []
    const n = teams.length
    
    // Generate round-robin pairs
    for (let round = 0; round < n - 1; round++) {
      const roundMatches = []
      for (let i = 0; i < n / 2; i++) {
        const team1 = teams[i]
        const team2 = teams[n - 1 - i]
        if (team1 && team2) {
          roundMatches.push({
            home: team1,
            away: team2
          })
        }
      }
      schedule.push(roundMatches)
      
      // Rotate teams for next round (keep first team fixed, rotate others)
      const temp = teams[1]
      for (let i = 1; i < n - 1; i++) {
        teams[i] = teams[i + 1]
      }
      teams[n - 1] = temp
    }
    
    return schedule
  }

  // Generate schedules for each table
  const tableSchedules: { [tableId: string]: any[] } = {}
  for (const table of tournamentTables) {
    const tableTeams = teams.filter(team => team.tournamentTableId === table.id)
    tableSchedules[table.id] = createRoundRobinSchedule([...tableTeams])
  }

  // Track match assignments per day to ensure no consecutive play
  const teamsPlayedPerDay: { [date: string]: Set<string> } = {}
  const tableMatchIndex: { [tableId: string]: number } = {}

  // Initialize match indices for each table
  for (const table of tournamentTables) {
    tableMatchIndex[table.id] = 0
  }

  // Create matches according to the tournament schedule
  for (const scheduleDay of tournamentSchedule) {
    const matchDate = new Date(2025, 7, scheduleDay.date) // August 2025 (month is 0-indexed)
    const dateKey = scheduleDay.date.toString()
    
    // Initialize teams played for this day
    if (!teamsPlayedPerDay[dateKey]) {
      teamsPlayedPerDay[dateKey] = new Set()
    }
    
    for (const matchSchedule of scheduleDay.matches) {
      const table = tournamentTables[matchSchedule.tableIndex]
      const tableTeams = teams.filter(team => team.tournamentTableId === table.id)
      
      // Get the next match from this table's round-robin schedule
      const tableSchedule = tableSchedules[table.id]
      const currentRound = Math.floor(tableMatchIndex[table.id] / 2) // 2 matches per round
      const matchInRound = tableMatchIndex[table.id] % 2
      
      if (currentRound < tableSchedule.length && matchInRound < tableSchedule[currentRound].length) {
        const match = tableSchedule[currentRound][matchInRound]
        
        // Check if either team has already played today
        if (teamsPlayedPerDay[dateKey].has(match.home.id) || teamsPlayedPerDay[dateKey].has(match.away.id)) {
          // Skip this match and try the next one
          tableMatchIndex[table.id]++
          continue
        }
        
        // Mark these teams as having played today
        teamsPlayedPerDay[dateKey].add(match.home.id)
        teamsPlayedPerDay[dateKey].add(match.away.id)
        
        // Create the date treating the times as if they're in UTC
        // This ensures consistent display across all environments
        const matchDateTime = new Date(Date.UTC(2025, 7, scheduleDay.date, matchSchedule.time.hour, matchSchedule.time.minute, 0, 0))

        await prisma.match.create({
          data: {
            tournamentTableId: table.id,
            homeTeamId: match.home.id,
            awayTeamId: match.away.id,
            scheduledAt: matchDateTime,
            status: 'SCHEDULED',
            format: 'BO3',
            matchType: 'GROUP_STAGE',
          },
        })
        
        console.log(`Created match: ${match.home.name} vs ${match.away.name} at ${matchDateTime.toLocaleString()}`)
        
        // Move to next match for this table
        tableMatchIndex[table.id]++
      }
    }
  }

  // Create some completed group stage matches for demonstration
  const completedMatches = await prisma.match.findMany({
    where: { matchType: 'GROUP_STAGE' },
    take: 6, // Complete first 6 group stage matches
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  })

  for (const match of completedMatches) {
    const maxGames = match.format === 'BO5' ? 5 : 3
    const requiredWins = match.format === 'BO5' ? 3 : 2
    
    let homeGamesWon = 0
    let awayGamesWon = 0
    let totalHomePoints = 0
    let totalAwayPoints = 0
    let gameNumber = 1

    // Simulate games until one team wins the required number
    while (homeGamesWon < requiredWins && awayGamesWon < requiredWins && gameNumber <= maxGames) {
      // Generate realistic table tennis scores (11-21 points, win by 2)
      let homeScore = Math.floor(Math.random() * 11) + 11 // 11-21
      let awayScore = Math.floor(Math.random() * 11) + 11 // 11-21
      
      // Ensure one team wins by at least 2 points
      if (Math.abs(homeScore - awayScore) < 2) {
        if (Math.random() > 0.5) {
          homeScore = Math.max(homeScore, awayScore) + 2
        } else {
          awayScore = Math.max(homeScore, awayScore) + 2
        }
      }
      
      // Make sure scores are realistic (11+ and win by 2)
      if (homeScore >= 11 && awayScore >= 11) {
        if (homeScore === awayScore) {
          homeScore += Math.random() > 0.5 ? 2 : 0
          awayScore += homeScore > awayScore ? 0 : 2
        }
      } else {
        // Ensure minimum score of 11 for winner
        if (homeScore > awayScore) {
          homeScore = Math.max(homeScore, 11)
        } else {
          awayScore = Math.max(awayScore, 11)
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
      })

      // Update counters
      if (homeScore > awayScore) {
        homeGamesWon++
      } else {
        awayGamesWon++
      }
      
      totalHomePoints += homeScore
      totalAwayPoints += awayScore
      gameNumber++
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
    })

    // Update team stats
    const homeWin = homeGamesWon > awayGamesWon
    
    await prisma.team.update({
      where: { id: match.homeTeamId },
      data: {
        matchesPlayed: { increment: 1 },
        wins: homeWin ? { increment: 1 } : undefined,
        losses: homeWin ? undefined : { increment: 1 },
        points: { increment: totalHomePoints },
        pointsAgainst: { increment: totalAwayPoints },
      },
    })

    await prisma.team.update({
      where: { id: match.awayTeamId },
      data: {
        matchesPlayed: { increment: 1 },
        wins: homeWin ? undefined : { increment: 1 },
        losses: homeWin ? { increment: 1 } : undefined,
        points: { increment: totalAwayPoints },
        pointsAgainst: { increment: totalHomePoints },
      },
    })

    console.log(`Completed ${match.format} match: ${match.homeTeam.name} ${homeGamesWon} - ${awayGamesWon} ${match.awayTeam.name} (${totalHomePoints}-${totalAwayPoints} points)`)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })