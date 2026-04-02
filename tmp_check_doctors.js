const { sequelize } = require('./server/config/database');
const { Doctor, User } = require('./server/models');

async function checkDoctors() {
  try {
    const doctors = await Doctor.findAll({
      include: [{ association: 'user' }]
    });

    console.log(`Found ${doctors.length} Doctors in DB.`);
    doctors.forEach(d => {
      console.log(`- Dr. ${d.user.firstName} ${d.user.lastName}`);
      console.log(`  isActive: ${d.user.isActive}`);
      console.log(`  isVerified: ${d.isVerified}`);
      console.log(`  BMDC: ${d.bmdcRegistrationNumber}`);
      console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDoctors();
