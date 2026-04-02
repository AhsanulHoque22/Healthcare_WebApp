require('dotenv').config();
process.env.MYSQLHOST = 'localhost';
const { User, Doctor, Patient } = require('./models');
const { sequelize } = require('./config/database');

async function findUsers() {
  try {
    const doctors = await User.findAll({
      where: { role: 'doctor' },
      include: [{ model: Doctor, as: 'doctorProfile' }],
      limit: 2
    });
    
    const patients = await User.findAll({
      where: { role: 'patient' },
      include: [{ model: Patient, as: 'patientProfile' }],
      limit: 2
    });

    console.log('DOCTORS:');
    doctors.forEach(d => {
      console.log(`- Email: ${d.email}, Name: ${d.firstName} ${d.lastName}, ID: ${d.id}`);
    });

    console.log('\nPATIENTS:');
    patients.forEach(p => {
      console.log(`- Email: ${p.email}, Name: ${p.firstName} ${p.lastName}, ID: ${p.id}, DOB: ${p.dateOfBirth}, Gender: ${p.gender}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

findUsers();
