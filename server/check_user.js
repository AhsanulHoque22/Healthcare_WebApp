require('dotenv').config();
const { ChatHistory, User, Patient } = require('./models');
const { Op } = require('sequelize');

async function checkLastMessages() {
  try {
    const messages = await ChatHistory.findAll({
      where: {
        createdAt: { [Op.gt]: new Date(Date.now() - 30 * 60 * 1000) }, // last 30 mins
        role: 'user'
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: User, as: 'user' }]
    });

    console.log(`Found ${messages.length} recent user messages.`);
    for (const m of messages) {
      const patient = await Patient.findOne({ where: { userId: m.userId } });
      console.log(`- Time: ${m.createdAt}`);
      console.log(`  User ID: ${m.userId} (${m.user?.firstName} ${m.user?.lastName})`);
      console.log(`  Patient ID: ${patient?.id || 'NONE'}`);
      console.log(`  Message: ${m.content}`);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkLastMessages();
