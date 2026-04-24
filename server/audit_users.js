require('dotenv').config();
// Force Supabase config
process.env.DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres.kalupffchmgcdljjgwbf';
process.env.DB_PASSWORD = 'MynameisRatul12#$';
process.env.DB_NAME = 'postgres';
process.env.DB_DIALECT = 'postgres';

const { sequelize } = require('./config/database');
const { User, Patient, Doctor } = require('./models');

async function debugUsers() {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({
      include: [
        { association: 'patientProfile' },
        { association: 'doctorProfile' }
      ]
    });

    console.log('--- User Profile Audit ---');
    users.forEach(u => {
      const profile = u.patientProfile ? 'Patient' : (u.doctorProfile ? 'Doctor' : 'NONE');
      console.log(`User ${u.id} (${u.email}) - Role: ${u.role}, Profile: ${profile}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
}
debugUsers();
