// scripts/migrate.js - Database migration script
const mongoose = require('mongoose');
const User = require('../models/User');
const Download = require('../models/Download');
const { Analytics, SystemOptimization } = require('../models/Analytics');
const ProtocolSession = require('../models/ProtocolSession');
require('dotenv').config();

const migrations = [
  {
    version: '1.0.0',
    description: 'Initial database setup',
    up: async () => {
      console.log('Creating initial indexes...');
      
      // Ensure indexes are created
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ discord_id: 1 }, { unique: true });
      await Download.collection.createIndex({ product_name: 1, version: -1 });
      await Analytics.collection.createIndex({ user_id: 1, timestamp: -1 });
      await SystemOptimization.collection.createIndex({ user_id: 1, created_at: -1 });
      
      console.log('✅ Initial indexes created');
    }
  },
  {
    version: '1.1.0',
    description: 'Add user preferences and API usage tracking',
    up: async () => {
      console.log('Adding new fields to user documents...');
      
      await User.updateMany(
        { preferences: { $exists: false } },
        {
          $set: {
            preferences: {
              theme: 'dark',
              notifications: true,
              auto_updates: true,
              telemetry: true,
              language: 'en'
            },
            api_usage: {
              requests_today: 0,
              last_request: null,
              rate_limit_reset: null
            }
          }
        }
      );
      
      console.log('✅ User preferences and API usage fields added');
    }
  },
  {
    version: '1.2.0',
    description: 'Add subscription tracking',
    up: async () => {
      console.log('Adding subscription fields...');
      
      await User.updateMany(
        { subscription: { $exists: false } },
        {
          $set: {
            subscription: {
              type: 'free',
              start_date: null,
              end_date: null,
              auto_renew: false,
              payment_method: null
            }
          }
        }
      );
      
      console.log('✅ Subscription fields added');
    }
  }
];

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Check if migrations collection exists
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const migrationsExists = collections.some(col => col.name === 'migrations');
    
    if (!migrationsExists) {
      await db.createCollection('migrations');
      console.log('✅ Created migrations collection');
    }
    
    // Get completed migrations
    const migrationsCollection = db.collection('migrations');
    const completedMigrations = await migrationsCollection.find({}).toArray();
    const completedVersions = completedMigrations.map(m => m.version);
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!completedVersions.includes(migration.version)) {
        console.log(`\n🔄 Running migration ${migration.version}: ${migration.description}`);
        
        try {
          await migration.up();
          
          // Record migration as completed
          await migrationsCollection.insertOne({
            version: migration.version,
            description: migration.description,
            completed_at: new Date()
          });
          
          console.log(`✅ Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`❌ Migration ${migration.version} failed:`, error);
          throw error;
        }
      } else {
        console.log(`⏭️  Migration ${migration.version} already completed`);
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations, migrations };