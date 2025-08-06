# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Database Setup**: Ensure you have a PostgreSQL database (Neon, Supabase, etc.)
2. **Vercel Account**: Connected to your GitHub repository

## Environment Variables

Set these in your Vercel dashboard (Settings → Environment Variables):

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://username:password@host:port/database` | ✅ |
| `NEXTAUTH_SECRET` | `b641161851e0a998c3f03c53cc257a7ece10ae7ce9db6bbdac237d303a791558` | ✅ |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | ✅ |
| `SEED_SECRET_KEY` | `ping-pong-tournament-seed-2024-xyz789` | ⚠️ |

## Build Configuration

- **Build Command**: `npm run build` (automatically includes Prisma generation)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

## Deployment Steps

### 1. Deploy to Vercel
```bash
# Push your code to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Run Database Migrations (After Deployment)
```bash
# Option A: Using Vercel CLI
vercel env pull .env.local
npm run db:migrate:prod

# Option B: Using Vercel Functions
# Create a temporary API route for migrations
```

### 3. Seed the Database
```bash
# Option A: Using the script
npm run db:seed:prod

# Option B: Using curl
curl -X POST "https://your-app.vercel.app/api/seed?key=ping-pong-tournament-seed-2024-xyz789"

# Option C: Using browser
# Visit: https://your-app.vercel.app/api/seed?key=ping-pong-tournament-seed-2024-xyz789
```

## Troubleshooting

### P1002 Database Connection Error

**Cause**: Database not accessible from Vercel's build environment

**Solutions**:

1. **Check DATABASE_URL**:
   ```bash
   # Ensure it's in the correct format
   postgresql://username:password@host:port/database?sslmode=require
   ```

2. **Use Connection Pooling** (Recommended for Neon):
   ```bash
   # Add ?pgbouncer=true&connect_timeout=10 to your DATABASE_URL
   postgresql://username:password@host:port/database?sslmode=require&pgbouncer=true&connect_timeout=10
   ```

3. **Check Database Access**:
   - Ensure your database allows connections from Vercel's IP ranges
   - Verify SSL is enabled
   - Check if your database requires specific connection parameters

### Alternative Migration Approach

If migrations continue to fail during build, create a temporary migration API route:

```typescript
// src/app/api/migrate/route.ts (temporary)
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');
    
    if (secretKey !== process.env.SEED_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    return NextResponse.json({ success: true, message: 'Migrations completed' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Then call: `https://your-app.vercel.app/api/migrate?key=your-secret-key`

## Database Providers

### Neon (Recommended)
- Free tier available
- Automatic connection pooling
- SSL enabled by default
- Works well with Vercel

### Supabase
- Free tier available
- Built-in connection pooling
- Good integration with Vercel

### Railway
- Free tier available
- Easy setup
- Good for development

## Final Checklist

- [ ] Environment variables set in Vercel
- [ ] Application deployed successfully
- [ ] Database migrations run
- [ ] Database seeded with initial data
- [ ] Admin panel accessible at `/assmin`
- [ ] Login works with `admin@company.com` / `admin123`

## Access Your Application

- **Main App**: `https://your-app.vercel.app`
- **Admin Panel**: `https://your-app.vercel.app/assmin`
- **Login**: `admin@company.com` / `admin123`

## Support

If you continue to have issues:

1. Check Vercel build logs for specific error messages
2. Verify your database connection string
3. Test database connectivity from your local machine
4. Consider using a different database provider 