require('dotenv').config();
const { Op, fn, col } = require('sequelize');
const { ChatHistory } = require('./models');

async function test() {
  try {
    const userId = 1; // Assuming userId 1 exists
    const sessionMeta = await ChatHistory.findAll({
        where: {
          // userId,
          conversationId: { [Op.ne]: null }
        },
        attributes: [
          'conversationId',
          [fn('MAX', col('created_at')), 'lastMessageAt']
        ],
        group: ['conversationId'],
        order: [[fn('MAX', col('created_at')), 'DESC']],
        raw: true
      });
      console.log('Sessions count:', sessionMeta.length);
      console.log('Sessions:', sessionMeta);

      const sessions = await Promise.all(
        sessionMeta.map(async (session) => {
          const firstMsg = await ChatHistory.findOne({
            where: {
              // userId,
              conversationId: session.conversationId,
              title: { [Op.ne]: null }
            },
            order: [['created_at', 'ASC']],
            attributes: ['title'],
            raw: true
          });
          return {
            conversationId: session.conversationId,
            title: firstMsg?.title || 'Conversation',
            lastMessageAt: session.lastMessageAt
          };
        })
      );
      console.log('Final format:', sessions);

  } catch(e) {
    console.error("ERROR:", e.message);
  }
  process.exit(0);
}
test();
