#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const config = {
  // Replace with your actual Vercel deployment URL
  baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  // Replace with your secret key (should match SEED_SECRET_KEY in Vercel)
  secretKey: process.env.SEED_SECRET_KEY || 'your-secret-key-here'
};

async function seedDatabase() {
  const url = `${config.baseUrl}/api/seed?key=${config.secretKey}`;
  
  console.log('🌱 Starting database seeding...');
  console.log(`📡 Calling: ${config.baseUrl}/api/seed`);
  
  return new Promise((resolve, reject) => {
    const client = config.baseUrl.startsWith('https') ? https : http;
    
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Database seeded successfully!');
            console.log('📊 Response:', response);
            console.log('\n🔑 Admin credentials:');
            console.log(`   Email: ${response.adminEmail}`);
            console.log(`   Password: ${response.adminPassword}`);
            console.log('\n🎯 You can now access the admin panel at:');
            console.log(`   ${config.baseUrl}/admin`);
          } else {
            console.error('❌ Seeding failed:', response);
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Failed to parse response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Run the seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase }; 