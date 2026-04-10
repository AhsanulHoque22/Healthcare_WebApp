/**
 * chatbotController.js
 * 
 * Handles HTTP requests for the Livora AI chatbot.
 * The service does all heavy lifting via the agentic loop —
 * the controller is lean: auth, persistence, response shaping.
 */

const chatbotService = require('../services/chatbotService');
const { Patient, ChatHistory, Notification } = require('../models');

class ChatbotController {

  /**
   * POST /api/chatbot/message
   * Main entry point for user messages (text or voice-transcribed text).
   */
  async handleMessage(req, res, next) {
    try {
      const { message, history, conversationId, title } = req.body;
      const userId = req.user.id;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message cannot be empty' });
      }

      // 1. Persist the user's message
      await ChatHistory.create({
        userId,
        role: 'user',
        content: message.trim(),
        conversationId: conversationId || null,
        title: title || null
      });

      // 2. Build conversation context for the LLM.
      //    When a conversationId is present, load history from DB so context
      //    persists across page refreshes (client may not send history).
      //    Fall back to client-provided history (used by ChatbotWidget).
      let contextHistory = history || [];
      if (conversationId) {
        try {
          const dbHistory = await ChatHistory.findAll({
            where: { userId, conversationId },
            order: [['created_at', 'ASC']],
            limit: 20, // last 20 rows = ~10 exchanges
            attributes: ['role', 'content', 'availableDoctors', 'bookingDetails']
          });
          // Exclude the message we just persisted (last user msg)
          const historyWithoutLatest = dbHistory.slice(0, -1);
          if (historyWithoutLatest.length > 0) {
            contextHistory = historyWithoutLatest.map(h => ({
              role: h.role,
              content: h.content,
              availableDoctors: h.availableDoctors,
              bookingDetails: h.bookingDetails
            }));
          }
        } catch (e) {
          console.warn('[ChatbotController] Could not load DB history for context:', e.message);
        }
      }

      // 3. Run the full agentic reasoning pipeline
      const aiResponse = await chatbotService.processMessage(req.user, message.trim(), contextHistory);

      // 4. If an emergency was truly triggered, augment the message with emergency contact info
      if (aiResponse.isEmergency) {
        const patient = await Patient.findOne({ where: { userId } });
        const contactInfo = patient?.emergencyContact
          ? `\n\n🆘 Emergency contact on file: **${patient.emergencyContact}** — ${patient.emergencyPhone || 'no phone listed'}. Please call **999** or go to your nearest emergency room immediately.`
          : `\n\n🆘 Please call **999** or go to your nearest emergency room immediately.`;

        aiResponse.message += contactInfo;
      }

      // 5. Persist the assistant's response
      await ChatHistory.create({
        userId,
        role: 'assistant',
        content: aiResponse.message,
        intent: aiResponse.intent,
        context: null,
        availableDoctors: aiResponse.availableDoctors || null,
        bookingDetails: aiResponse.bookingDetails || null,
        conversationId: conversationId || null,
        title: title || null
      });

      return res.json({
        success: true,
        data: aiResponse
      });

    } catch (error) {
      console.error('[ChatbotController] handleMessage error:', error.message);
      next(error);
    }
  }

  /**
   * GET /api/chatbot/history
   * Returns the authenticated user's chat history (account-isolated).
   * Limit to 50 most recent messages to keep context manageable.
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { conversationId } = req.query;

      const where = { userId };
      if (conversationId) where.conversationId = conversationId;

      const history = await ChatHistory.findAll({
        where,
        order: [['created_at', 'ASC']],
        limit: 100,
        attributes: ['id', 'role', 'content', 'intent', 'availableDoctors', 'bookingDetails', 'createdAt', 'conversationId']
      });

      return res.json({
        success: true,
        data: history
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/chatbot/voice
   * Unified handler for voice-to-text input — same pipeline as text.
   */
  async handleVoice(req, res, next) {
    return this.handleMessage(req, res, next);
  }

  /**
   * GET /api/chatbot/sessions
   * Returns distinct conversation sessions for the authenticated user,
   * sorted by most recent activity.
   *
   * Fix: We used to GROUP BY title which caused duplicate rows when different
   * messages in the same conversation had different title values. Now we only
   * group by conversationId and pull the title from a correlated sub-query
   * (the first message of each conversation).
   */
  async getSessions(req, res, next) {
    try {
      const userId = req.user.id;
      const { Op, fn, col } = require('sequelize');
      const ChatHistory = require('../models').ChatHistory;

      // Step 1: Get all distinct conversationIds with their latest activity time
      const sessionMeta = await ChatHistory.findAll({
        where: {
          userId,
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

      if (!sessionMeta.length) {
        return res.json({ success: true, data: [] });
      }

      // Step 2: For each conversation, get the title from the FIRST message
      const sessions = await Promise.all(
        sessionMeta.map(async (session) => {
          const firstMsg = await ChatHistory.findOne({
            where: {
              userId,
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

      return res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/chatbot/history
   */
  async clearHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { conversationId } = req.query;
      
      const where = { userId };
      if (conversationId) where.conversationId = conversationId;

      await ChatHistory.destroy({ where });
      return res.json({ success: true, message: 'Conversation history cleared.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatbotController();
