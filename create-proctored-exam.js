const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'oas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'shiva'
});

async function createProctoredExam() {
  try {
    await client.connect();
    
    // Get admin user ID
    const adminResult = await client.query('SELECT id FROM "Users" WHERE role = \'admin\' LIMIT 1;');
    if (adminResult.rows.length === 0) {
      console.log('No admin user found. Creating one...');
      await client.query(`
        INSERT INTO "Users" (username, email, password, name, role, "createdAt", "updatedAt") 
        VALUES ('admin', 'admin@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin', NOW(), NOW())
      `);
      const newAdminResult = await client.query('SELECT id FROM "Users" WHERE username = \'admin\';');
      adminId = newAdminResult.rows[0].id;
    } else {
      adminId = adminResult.rows[0].id;
    }
    
    // Create a proctored exam
    const examData = {
      title: 'Proctored Test Demo',
      description: 'A sample proctored exam to test the proctoring system',
      duration: 15, // 15 minutes
      questions: [
        {
          _id: '1',
          type: 'multiple-choice',
          question: 'What is the capital of France?',
          options: [
            { _id: 'a', text: 'London', isCorrect: false },
            { _id: 'b', text: 'Paris', isCorrect: true },
            { _id: 'c', text: 'Berlin', isCorrect: false },
            { _id: 'd', text: 'Madrid', isCorrect: false }
          ],
          points: 2
        },
        {
          _id: '2',
          type: 'true-false',
          question: 'The Earth is flat.',
          correctAnswer: 'false',
          points: 1
        },
        {
          _id: '3',
          type: 'multiple-choice',
          question: 'Which programming language is known for web development?',
          options: [
            { _id: 'a', text: 'Python', isCorrect: false },
            { _id: 'b', text: 'JavaScript', isCorrect: true },
            { _id: 'c', text: 'C++', isCorrect: false },
            { _id: 'd', text: 'Assembly', isCorrect: false }
          ],
          points: 2
        }
      ],
      proctoringEnabled: true,
      isActive: true,
      createdBy: adminId,
      totalPoints: 5,
      type: 'exam',
      passingScore: 60
    };
    
    const result = await client.query(`
      INSERT INTO "Exams" (title, description, duration, questions, "proctoringEnabled", "isActive", "createdBy", "totalPoints", type, "passingScore", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, title;
    `, [
      examData.title,
      examData.description,
      examData.duration,
      JSON.stringify(examData.questions),
      examData.proctoringEnabled,
      examData.isActive,
      examData.createdBy,
      examData.totalPoints,
      examData.type,
      examData.passingScore
    ]);
    
    console.log(`✓ Created proctored exam: "${result.rows[0].title}" (ID: ${result.rows[0].id})`);
    
    // Verify proctoring is enabled
    const verification = await client.query('SELECT title, "proctoringEnabled" FROM "Exams" WHERE id = $1;', [result.rows[0].id]);
    console.log(`✓ Proctoring enabled: ${verification.rows[0].proctoringEnabled}`);
    
    console.log('\nProctoring features that will be active:');
    console.log('- Camera and microphone access required');
    console.log('- Face detection and counting');
    console.log('- Tab switching detection');
    console.log('- Copy/paste prevention');
    console.log('- Right-click disabled');
    console.log('- Fullscreen mode required');
    console.log('- Violation tracking and risk scoring');
    console.log('- Automatic blocking after multiple violations');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

createProctoredExam();