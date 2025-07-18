// scripts/setup.js - Initial setup script
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const setupDirectories = async () => {
  const directories = [
    'logs',
    'uploads',
    'temp',
    'backups'
  ];
  
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir}:`, error.message);
    }
  }
};

const runSetup = async () => {
  console.log('🚀 Starting Nova API setup...\n');
  
  await setupDirectories();
  console.log('');
  
  console.log('✅ Setup completed!\n');
  console.log('Next steps:');
  console.log('1. Update Discord OAuth credentials in .env file');
  console.log('2. Run "npm install" to install dependencies');
  console.log('3. Run "npm run seed" to populate the database');
  console.log('4. Run "npm run dev" to start the development server');
};

if (require.main === module) {
  runSetup();
}

module.exports = { runSetup, setupDirectories };
