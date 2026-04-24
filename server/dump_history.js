require('dotenv').config();
const { ChatHistory, User } = require('./models');
const { Op } = require('sequelize');

async function dumpHistory() {
  try {
    const messages = await ChatHistory.findAll({
      where: {
        createdAt: { [Op.gt]: new Date(Date.now() - 30 * 60 * 1000) }, // last 30 mins
      },
      order: [['createdAt', 'ASC']],
      include: [{ model: User, as: 'user' }]
    });

    console.log(`Dumping ${messages.length} log entries from last 30 mins:`);
    for (const m of messages) {
       console.log(`[${m.createdAt.toISOString()}] ${m.role.toUpperCase()}: ${m.content.slice(0, 500)}`);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

dumpHistory();
