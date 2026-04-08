const chatbotService = require('../services/chatbotService');
const appointmentController = require('./appointmentController');
const { Patient } = require('../models');

class ChatbotController {
  /**
   * Main entry point for chatbot messages (text or voice-to-text)
   */
  async handleMessage(req, res, next) {
    try {
      const { message, history } = req.body;
      const userId = req.user.id; // From auth middleware

      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      // 1. Get AI reasoning and module outputs
      const aiResponse = await chatbotService.processMessage(userId, message, history);

      // 2. Module: AI Appointment Booking Agent
      // If AI detects final booking intent and has all fields
      if (aiResponse.intent === 'BOOKING' && aiResponse.context.doctorId && aiResponse.context.appointmentDate && aiResponse.context.timeBlock) {
        
        const patient = await Patient.findOne({ where: { userId } });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

        // Populate request body for internal call to createAppointment
        // Reusing existing API logic to ensure STRICT data consistency
        req.body = {
          patientId: patient.id,
          doctorId: aiResponse.context.doctorId,
          appointmentDate: aiResponse.context.appointmentDate,
          timeBlock: aiResponse.context.timeBlock,
          reason: aiResponse.context.reason || `AI-Assisted Booking: ${aiResponse.context.symptoms?.join(', ')}`,
          symptoms: aiResponse.context.symptoms?.join(', '),
          type: 'in_person' // Defaulting to in-person for AI bookings
        };

        // Run existing creation logic
        // We pass a mock response object to capture the result
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              if (data.success) {
                aiResponse.message += `\n\n✅ CONFIRMED: Your appointment is booked for ${aiResponse.context.appointmentDate} at ${aiResponse.context.timeBlock}.`;
                aiResponse.bookingDetails = data.data.appointment;
              } else {
                aiResponse.message += `\n\n❌ Booking Error: ${data.message}`;
              }
              return res.json({ success: true, data: aiResponse });
            }
          })
        };

        return await appointmentController.createAppointment(req, mockRes, next);
      }

      // Default response
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
   * Unified voice handler - treats transcription as message
   */
  async handleVoice(req, res, next) {
    // This is called after Deepgram transcription
    // Reuse handleMessage logic
    return this.handleMessage(req, res, next);
  }
}

module.exports = new ChatbotController();
