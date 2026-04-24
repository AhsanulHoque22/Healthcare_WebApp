/**
 * chatbotController.js
 * 
 * Handles HTTP requests for the Livora AI chatbot.
 * The service does all heavy lifting via the agentic loop —
 * the controller is lean: auth, persistence, response shaping.
 */

const chatbotService = require('../services/chatbotService');
const { Patient, ChatHistory, Notification } = require('../models');
const { scanInput } = require('../services/chatbot/inputGuard');
const { maybeSummarize } = require('../services/chatbot/conversationSummarizer');

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

      // 1. Input guard — block prompt injection before anything else runs
      const guardResult = await scanInput(message.trim(), userId);
      if (guardResult.blocked) {
        return res.status(200).json({
          success: true,
          data: {
            message: "I can only help with healthcare-related questions. How can I assist you with your health today?",
            intent: 'GENERAL',
            classification: null,
            safetyPipelineTriggered: false,
            validated: false,
            availableDoctors: null,
            bookingDetails: null,
          }
        });
      }

      // 2. Persist the user's message
      await ChatHistory.create({
        userId,
        role: 'user',
        content: message.trim(),
        conversationId: conversationId || null,
        title: title || null
      });

      // 3. Build conversation context for the LLM.
      //    When a conversationId is present, load history from DB so context
      //    persists across page refreshes (client may not send history).
      //    Fall back to client-provided history (used by ChatbotWidget).
      let contextHistory = history || [];
      if (conversationId) {
        try {
          const { Op } = require('sequelize');
          const dbHistory = await ChatHistory.findAll({
            where: { userId, conversationId, role: { [Op.in]: ['user', 'assistant'] } },
            order: [['created_at', 'ASC']],
            limit: 20,
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

      // 3. Run the full agentic reasoning pipeline (pass conversationId for summary injection)
      const aiResponse = await chatbotService.processMessage(req.user, message.trim(), contextHistory, conversationId || null);

      // 4. If an emergency was truly triggered, augment the message with emergency contact info
      if (aiResponse.isEmergency) {
        const patient = await Patient.findOne({ where: { userId } });
        const contactInfo = patient?.emergencyContact
          ? `\n\n🆘 Emergency contact on file: **${patient.emergencyContact}** — ${patient.emergencyPhone || 'no phone listed'}. Please call **999** or go to your nearest emergency room immediately.`
          : `\n\n🆘 Please call **999** or go to your nearest emergency room immediately.`;

        aiResponse.message += contactInfo;
      }

      // 5. Persist the assistant's response
      const savedAssistantMsg = await ChatHistory.create({
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

      // 6. Fire-and-forget summarization check — never blocks the response
      if (conversationId) {
        maybeSummarize(userId, conversationId).catch((err) =>
          console.error('[ChatbotController] maybeSummarize error:', err.message)
        );
      }

      return res.json({
        success: true,
        data: { ...aiResponse, messageId: savedAssistantMsg.id }
      });

    } catch (error) {
      console.error('[ChatbotController] handleMessage error:', error.message);
      next(error);
    }
  }

  /**
   * POST /api/chatbot/message/stream
   * SSE streaming endpoint — tokens arrive progressively instead of after a full 25s wait.
   */
  async handleStreamMessage(req, res, next) {
    try {
      const { message, history, conversationId, title } = req.body;
      const userId = req.user.id;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message cannot be empty' });
      }

      // Input guard
      const guardResult = await scanInput(message.trim(), userId);
      if (guardResult.blocked) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.write(`data: ${JSON.stringify({ type: 'done', message: "I can only help with healthcare-related questions.", intent: 'GENERAL', isEmergency: false, classification: null, safetyPipelineTriggered: false, validated: false, availableDoctors: null, bookingDetails: null })}\n\n`);
        return res.end();
      }

      // Persist user message
      await ChatHistory.create({
        userId, role: 'user', content: message.trim(),
        conversationId: conversationId || null, title: title || null
      });

      // Build context history
      let contextHistory = history || [];
      if (conversationId) {
        try {
          const { Op } = require('sequelize');
          const dbHistory = await ChatHistory.findAll({
            where: { userId, conversationId, role: { [Op.in]: ['user', 'assistant'] } },
            order: [['created_at', 'ASC']], limit: 20,
            attributes: ['role', 'content', 'availableDoctors', 'bookingDetails']
          });
          const withoutLatest = dbHistory.slice(0, -1);
          if (withoutLatest.length > 0) {
            contextHistory = withoutLatest.map(h => ({ role: h.role, content: h.content }));
          }
        } catch (e) {
          console.warn('[ChatbotController] Could not load DB history:', e.message);
        }
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let finalAiResponse = null;

      await chatbotService.processMessageStream(req.user, message.trim(), contextHistory, conversationId || null, {
        onToken: (token) => {
          res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
        },
        onToolStart: (toolName) => {
          res.write(`data: ${JSON.stringify({ type: 'tool', tool: toolName })}\n\n`);
        },
        onComplete: (aiResponse) => {
          finalAiResponse = aiResponse;
          // Don't write done or end yet — persist first to capture messageId
        },
      });

      // Persist assistant response, include messageId in done event, then end stream
      if (finalAiResponse) {
        const savedStreamMsg = await ChatHistory.create({
          userId, role: 'assistant', content: finalAiResponse.message,
          intent: finalAiResponse.intent, context: null,
          availableDoctors: finalAiResponse.availableDoctors || null,
          bookingDetails: finalAiResponse.bookingDetails || null,
          conversationId: conversationId || null, title: title || null
        });

        res.write(`data: ${JSON.stringify({ type: 'done', ...finalAiResponse, messageId: savedStreamMsg.id })}\n\n`);
        res.end();

        if (conversationId) {
          maybeSummarize(userId, conversationId).catch((err) =>
            console.error('[ChatbotController] maybeSummarize error:', err.message)
          );
        }
      } else {
        res.end();
      }
    } catch (error) {
      console.error('[ChatbotController] handleStreamMessage error:', error.message);
      if (!res.headersSent) return next(error);
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred.' })}\n\n`);
        res.end();
      } catch {}
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
        attributes: ['id', 'role', 'content', 'intent', 'availableDoctors', 'bookingDetails', 'createdAt', 'conversationId', 'feedbackRating', 'feedbackFlagged']
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
   * POST /api/chatbot/feedback
   * Records thumbs-up/down rating or a flag with reason on an assistant message.
   */
  async handleFeedback(req, res, next) {
    try {
      const { messageId, rating, flagged, flagReason } = req.body;
      const userId = req.user.id;

      if (!messageId) {
        return res.status(400).json({ success: false, message: 'messageId is required' });
      }
      if (rating && !['thumbs_up', 'thumbs_down'].includes(rating)) {
        return res.status(400).json({ success: false, message: 'rating must be thumbs_up or thumbs_down' });
      }
      if (flagReason && flagReason.length > 100) {
        return res.status(400).json({ success: false, message: 'flagReason too long' });
      }

      const record = await ChatHistory.findOne({
        where: { id: messageId, userId, role: 'assistant' }
      });
      if (!record) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }

      await record.update({
        feedbackRating: rating !== undefined ? rating : record.feedbackRating,
        feedbackFlagged: flagged !== undefined ? flagged : record.feedbackFlagged,
        feedbackFlagReason: flagReason !== undefined ? flagReason : record.feedbackFlagReason,
      });

      if (flagged) {
        console.warn(`[AUDIT] NEGATIVE_FEEDBACK userId=${userId} messageId=${messageId} reason=${flagReason || 'none'}`);
      }

      return res.json({ success: true });
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
