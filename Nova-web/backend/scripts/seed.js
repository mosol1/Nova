// scripts/seed.js - Database seeding script
const mongoose = require('mongoose');
const Download = require('../models/Download');
require('dotenv').config();

const seedDownloads = [
  {
    product_name: 'Nova Cleaner',
    version: '2.4.1',
    download_count: 45000,
    release_notes: 'Enhanced registry cleaning with 50% faster scan times. Added smart duplicate detection and improved Windows 11 compatibility.',
    file_info: {
      filename: 'NovaCleanerSetup_v2.4.1.exe',
      file_size: 15728640, // 15MB
      checksum: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      download_url: 'https://releases.nova.app/cleaner/v2.4.1/NovaCleanerSetup_v2.4.1.exe',
      mirrors: [
        'https://cdn1.nova.app/cleaner/v2.4.1/NovaCleanerSetup_v2.4.1.exe',
        'https://cdn2.nova.app/cleaner/v2.4.1/NovaCleanerSetup_v2.4.1.exe'
      ]
    },
    compatibility: {
      min_windows_version: 'Windows 10 1909',
      max_windows_version: 'Windows 11 23H2',
      architecture: ['x64', 'x86'],
      requirements: ['2GB RAM', '100MB disk space', '.NET Framework 4.8']
    },
    is_active: true,
    is_beta: false,
    release_date: new Date('2024-11-15')
  },
  {
    product_name: 'Nova Tweaker',
    version: '1.8.3',
    download_count: 38000,
    release_notes: 'New gaming mode optimizations, improved privacy settings, and advanced system tweaks for Windows 11.',
    file_info: {
      filename: 'NovaTweakerSetup_v1.8.3.exe',
      file_size: 22020096, // 21MB
      checksum: 'sha256:b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
      download_url: 'https://releases.nova.app/tweaker/v1.8.3/NovaTweakerSetup_v1.8.3.exe',
      mirrors: [
        'https://cdn1.nova.app/tweaker/v1.8.3/NovaTweakerSetup_v1.8.3.exe'
      ]
    },
    compatibility: {
      min_windows_version: 'Windows 10 1903',
      max_windows_version: 'Windows 11 23H2',
      architecture: ['x64'],
      requirements: ['4GB RAM', '200MB disk space', 'Administrator privileges']
    },
    is_active: true,
    is_beta: false,
    release_date: new Date('2024-11-10')
  },
  {
    product_name: 'Nova Gaming',
    version: '0.9.2-beta',
    download_count: 22000,
    release_notes: 'Beta release: Game library auto-discovery, FPS overlay, and real-time performance optimization.',
    file_info: {
      filename: 'NovaGamingSetup_v0.9.2-beta.exe',
      file_size: 31457280, // 30MB
      checksum: 'sha256:c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
      download_url: 'https://releases.nova.app/gaming/v0.9.2-beta/NovaGamingSetup_v0.9.2-beta.exe',
      mirrors: []
    },
    compatibility: {
      min_windows_version: 'Windows 10 2004',
      max_windows_version: 'Windows 11 23H2',
      architecture: ['x64'],
      requirements: ['8GB RAM', '500MB disk space', 'DirectX 12', 'Dedicated GPU']
    },
    is_active: true,
    is_beta: true,
    release_date: new Date('2024-11-20')
  },
  {
    product_name: 'Nova Monitor',
    version: '1.0.0',
    download_count: 0,
    release_notes: 'Coming soon: Real-time system monitoring with advanced analytics and alerting.',
    file_info: {
      filename: 'NovaMonitorSetup_v1.0.0.exe',
      file_size: 0,
      checksum: '',
      download_url: '',
      mirrors: []
    },
    compatibility: {
      min_windows_version: 'Windows 10 1909',
      max_windows_version: 'Windows 11 23H2',
      architecture: ['x64', 'arm64'],
      requirements: ['4GB RAM', '150MB disk space']
    },
    is_active: false,
    is_beta: false,
    release_date: new Date('2024-12-01')
  },
  {
    product_name: 'Nova Suite',
    version: '2.4.0',
    download_count: 12000,
    release_notes: 'Complete Nova suite with all tools integrated. Save 40% compared to individual purchases.',
    file_info: {
      filename: 'NovaSuiteSetup_v2.4.0.exe',
      file_size: 67108864, // 64MB
      checksum: 'sha256:d4e5f6789012345678901234567890abcdef1234567890abcdef123456789',
      download_url: 'https://releases.nova.app/suite/v2.4.0/NovaSuiteSetup_v2.4.0.exe',
      mirrors: [
        'https://cdn1.nova.app/suite/v2.4.0/NovaSuiteSetup_v2.4.0.exe',
        'https://cdn2.nova.app/suite/v2.4.0/NovaSuiteSetup_v2.4.0.exe'
      ]
    },
    compatibility: {
      min_windows_version: 'Windows 10 1909',
      max_windows_version: 'Windows 11 23H2',
      architecture: ['x64'],
      requirements: ['8GB RAM', '1GB disk space', '.NET Framework 4.8', 'Administrator privileges']
    },
    is_active: true,
    is_beta: false,
    release_date: new Date('2024-11-18')
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Clear existing downloads
    await Download.deleteMany({});
    console.log('🗑️  Cleared existing downloads');
    
    // Insert seed data
    await Download.insertMany(seedDownloads);
    console.log(`✅ Inserted ${seedDownloads.length} download records`);
    
    // Verify insertion
    const count = await Download.countDocuments();
    console.log(`📊 Total downloads in database: ${count}`);
    
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedDownloads };

