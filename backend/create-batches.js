require('dotenv').config();
const { sequelize } = require('./config/database');
const { User, Batch } = require('./models');

async function createBatches() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Find admin user
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log('Creating sample batches...');

    // Create sample batches
    const batches = [
      {
        code: 'BATCH001',
        name: 'Full Stack Development - Batch 1',
        description: 'Complete full stack development program covering React, Node.js, and databases',
        createdBy: admin.id
      },
      {
        code: 'BATCH002',
        name: 'Data Science - Batch 1',
        description: 'Data science program covering Python, machine learning, and analytics',
        createdBy: admin.id
      },
      {
        code: 'BATCH003',
        name: 'DevOps Engineering - Batch 1',
        description: 'DevOps program covering Docker, Kubernetes, CI/CD, and cloud platforms',
        createdBy: admin.id
      }
    ];

    for (const batchData of batches) {
      const [batch, created] = await Batch.findOrCreate({
        where: { code: batchData.code },
        defaults: batchData
      });

      if (created) {
        console.log(`✅ Created batch: ${batch.name} (${batch.code})`);
      } else {
        console.log(`ℹ️  Batch already exists: ${batch.name} (${batch.code})`);
      }
    }

    console.log('✅ Batch creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating batches:', error);
    process.exit(1);
  }
}

createBatches();