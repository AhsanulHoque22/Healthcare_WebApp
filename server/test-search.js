require('dotenv').config();
process.env.MYSQLHOST = 'localhost';
const { Doctor, User } = require('./models');
const { Op } = require('sequelize');

async function testSearch(search) {
  try {
    const keywords = search.trim().split(/\s+/);
      
    const searchConditions = keywords.map(keyword => {
      return {
        [Op.or]: [
          { department: { [Op.like]: `%${keyword}%` } },
          { specialization: { [Op.like]: `%${keyword}%` } },
          { hospital: { [Op.like]: `%${keyword}%` } },
          { bmdcRegistrationNumber: { [Op.like]: `%${keyword}%` } },
          { bio: { [Op.like]: `%${keyword}%` } },
          { '$user.firstName$': { [Op.like]: `%${keyword}%` } },
          { '$user.lastName$': { [Op.like]: `%${keyword}%` } },
          Doctor.sequelize.where(
            Doctor.sequelize.fn('concat', Doctor.sequelize.col('user.first_name'), ' ', Doctor.sequelize.col('user.last_name')),
            { [Op.like]: `%${keyword}%` }
          )
        ]
      };
    });

    const doctors = await Doctor.findAll({
      where: { [Op.and]: searchConditions },
      include: [{ association: 'user' }]
    });

    console.log(`Search: "${search}"`);
    console.log(`Results: ${doctors.length}`);
    doctors.forEach(d => {
      console.log(`- Dr. ${d.user.firstName} ${d.user.lastName} (${d.hospital})`);
    });
    console.log('---');

  } catch (err) {
    console.error('Error:', err);
  }
}

async function runTests() {
  await testSearch('Tashdid');
  await testSearch('Apollo');
  await testSearch('Tashdid Apollo');
  process.exit();
}

runTests();
