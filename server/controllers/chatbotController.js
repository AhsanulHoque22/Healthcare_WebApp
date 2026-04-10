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
      const { message, history } = req.body;
      const userId = req.user.id;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message cannot be empty' });
      }

      // 1. Persist the user's message
      await ChatHistory.create({
        userId,
        role: 'user',
        content: message.trim()
      });

      // 2. Run the full agentic reasoning pipeline
      const aiResponse = await chatbotService.processMessage(req.user, message.trim(), history || []);

      // 3. If an emergency was truly triggered, augment the message with emergency contact info
      if (aiResponse.isEmergency) {
        const patient = await Patient.findOne({ where: { userId } });
        const contactInfo = patient?.emergencyContact
          ? `\n\n🆘 Emergency contact on file: **${patient.emergencyContact}** — ${patient.emergencyPhone || 'no phone listed'}. Please call **999** or go to your nearest emergency room immediately.`
          : `\n\n🆘 Please call **999** or go to your nearest emergency room immediately.`;

        aiResponse.message += contactInfo;
      }

      // 4. Persist the assistant's response
      await ChatHistory.create({
        userId,
        role: 'assistant',
        content: aiResponse.message,
        intent: aiResponse.intent,
        context: null,
        availableDoctors: aiResponse.availableDoctors || null,
        bookingDetails: aiResponse.bookingDetails || null
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

      const history = await ChatHistory.findAll({
        where: { userId },
        order: [['created_at', 'ASC']],
        limit: 50,
        attributes: ['id', 'role', 'content', 'intent', 'context', 'availableDoctors', 'bookingDetails', 'createdAt']
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
   * DELETE /api/chatbot/history
   * Clear chat history for the authenticated user (fresh start).
   */
  async clearHistory(req, res, next) {
    try {
      const userId = req.user.id;
      await ChatHistory.destroy({ where: { userId } });
      return res.json({ success: true, message: 'Conversation history cleared.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatbotController();
