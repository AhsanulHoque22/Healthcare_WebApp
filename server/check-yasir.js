require('dotenv').config();
process.env.MYSQLHOST = 'localhost';
const { User, Doctor } = require('./models');

async function checkYasir() {
  try {
    const user = await User.findOne({
      where: { firstName: 'Yasir' },
      include: [{ model: Doctor, as: 'doctorProfile' }]
    });

    if (user) {
      console.log('User found:');
      console.log(`- Name: ${user.firstName} ${user.lastName}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- IsActive: ${user.isActive}`);
      if (user.doctorProfile) {
        console.log('Doctor profile:');
        console.log(`- IsVerified: ${user.doctorProfile.isVerified}`);
        console.log(`- Rating: ${user.doctorProfile.rating}`);
        console.log(`- Hospital: ${user.doctorProfile.hospital}`);
      } else {
        console.log('No doctor profile found for this user.');
      }
    } else {
      console.log('User "Yasir" not found.');
      
      // List all verified doctors
      const doctors = await Doctor.findAll({
        where: { isVerified: true },
        include: [{ model: User, as: 'user' }]
      });
      console.log('\nAll Verified Doctors:');
      doctors.forEach(d => {
        console.log(`- Dr. ${d.user.firstName} ${d.user.lastName}, Rating: ${d.rating}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkYasir();
