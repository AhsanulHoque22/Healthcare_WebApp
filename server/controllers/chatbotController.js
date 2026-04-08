const chatbotService = require('../services/chatbotService');
const appointmentController = require('./appointmentController');
const { Patient, ChatHistory } = require('../models');

class ChatbotController {
  /**
   * Main entry point for chatbot messages (text or voice-to-text)
   */
  async handleMessage(req, res, next) {
    try {
      const { message, history } = req.body;
      const userId = req.user.id;

      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      // 1. Save User Message to DB (Isolation to account)
      await ChatHistory.create({
        userId,
        role: 'user',
        content: message
      });

      // 2. Get AI reasoning and module outputs
      const aiResponse = await chatbotService.processMessage(userId, message, history);

      // 3. Module: AI Appointment Booking Agent
      if (aiResponse.intent === 'BOOKING' && aiResponse.context.doctorId && aiResponse.context.appointmentDate && aiResponse.context.timeBlock) {
        
        const patient = await Patient.findOne({ where: { userId } });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

        req.body = {
          patientId: patient.id,
          doctorId: aiResponse.context.doctorId,
          appointmentDate: aiResponse.context.appointmentDate,
          timeBlock: aiResponse.context.timeBlock,
          reason: aiResponse.context.reason || `AI-Assisted Booking: ${aiResponse.context.symptoms?.join(', ')}`,
          symptoms: aiResponse.context.symptoms?.join(', '),
          type: 'in_person'
        };

        const mockRes = {
          status: (code) => ({
            json: (data) => {
              // Capture confirming message
              if (data.success) {
                aiResponse.message += `\n\n✅ CONFIRMED: Your appointment is booked for ${aiResponse.context.appointmentDate} at ${aiResponse.context.timeBlock}.`;
                aiResponse.bookingDetails = data.data.appointment;
              } else {
                aiResponse.message += `\n\n❌ Booking Error: ${data.message}`;
              }
              
              // Save Assistant Response to DB (isolated to account)
              ChatHistory.create({
                userId,
                role: 'assistant',
                content: aiResponse.message,
                intent: aiResponse.intent,
                context: aiResponse.context
              }).catch(err => console.error("[ChatbotHistory] Save failed:", err.message));

              return res.json({ success: true, data: aiResponse });
            }
          })
        };

        return appointmentController.createAppointment(req, mockRes, next);
      }

      // 4. Save Assistant Response if not booking
      await ChatHistory.create({
        userId,
        role: 'assistant',
        content: aiResponse.message,
        intent: aiResponse.intent,
        context: aiResponse.context
      });

      res.json({
        success: true,
        data: aiResponse
      });
    } catch (error) {
       console.error("[ChatbotController] Error:", error.message);
       next(error);
    }
  }

  /**
   * Get chat history for the authenticated user (Account Isolation)
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const history = await ChatHistory.findAll({
        where: { userId },
        order: [['created_at', 'ASC']],
        limit: 50
      });

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unified voice handler
   */
  async handleVoice(req, res, next) {
    return this.handleMessage(req, res, next);
  }
}

module.exports = new ChatbotController();
