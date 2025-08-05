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

      console.log(`Team created/updated: ${team.name}`);
    }

    console.log('Database seeding completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      adminEmail: admin.email,
      adminPassword: 'admin123', // Only return this in development
      teamsCreated: teamData.length,
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