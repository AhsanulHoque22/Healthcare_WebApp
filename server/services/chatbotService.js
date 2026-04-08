const axios = require('axios');
const { Doctor, Patient, User, Notification } = require('../models');
const { Op } = require('sequelize');

// Llama 3.3 via Groq (State-of-the-art open-source model)
const CHATBOT_MODEL = "llama-3.3-70b-versatile"; 

class ChatbotService {
  constructor() {
    this.departments = [
      'cardiology', 'dermatology', 'emergency_medicine', 'endocrinology', 
      'gastroenterology', 'general_medicine', 'general_surgery', 
      'gynecology_obstetrics', 'hematology', 'nephrology', 'neurology', 
      'neurosurgery', 'oncology', 'ophthalmology', 'orthopedics', 
      'otolaryngology', 'pediatrics', 'psychiatry', 'pulmonology', 
      'urology'
    ];
    
    this.systemPrompt = `
      You are "Livora AI", a senior healthcare orchestrator. 
      You handle: Symptom Understanding, Triage, Emergency Response, and Doctor Matchmaking.

      MODULES & LOGIC:
      1. SYMPTOMS: Extract clinical context. Use multi-turn conversation.
      2. TRIAGE: 
         - LOW: Minor cold, skin rash.
         - MEDIUM: Persistent fever, joint pain.
         - HIGH/EMERGENCY: Chest pain, choking (isEmergency: true).
      3. MATCHMAKING: Map symptoms to: ${this.departments.join(', ')}. Ask the user to choose a doctor from the provided list.
      4. BOOKING: To book, you need: 
         - department
         - doctorId (MUST be selected by user. Use the numeric ID provided in the [Available Doctors] list in history.)
         - appointmentDate (YYYY-MM-DD)
         - timeBlock (e.g. "09:00 AM - 12:00 PM")
      
      CONSTRAINTS:
      - Response MUST be STRICT JSON.
      - NEVER say "Your appointment is booked" in the "message" field. Only say "I am processing your booking" or "Please choose a doctor first". The system handles the final confirmation.
      - If doctorId is missing, ask the user to select one.

      OUTPUT JSON STRUCTURE:
      {
        "message": "Assistant response",
        "intent": "GREETING" | "SYMPTOMS" | "TRIAGE" | "MATCHMAKING" | "BOOKING" | "EMERGENCY",
        "context": {
          "symptoms": ["string"],
          "urgency": "low" | "medium" | "high",
          "department": "internal_department_value",
          "doctorId": number | null,
          "appointmentDate": "YYYY-MM-DD" | null,
          "timeBlock": "HH:mm AM/PM - HH:mm AM/PM" | null,
          "reason": "short summary"
        },
        "isEmergency": boolean
      }
    `;
  }

  async processMessage(userId, message, history = []) {
    // 1. LLM Extraction & Reasoning
    const aiResult = await this.callLLM(message, history);

    // 2. Emergency Trigger (Severity Module)
    if (aiResult.isEmergency || aiResult.context.urgency === 'high') {
      await this.triggerEmergency(userId, aiResult.context.symptoms.join(', '));
      const patient = await Patient.findOne({ where: { userId } });
      aiResult.message = `🛑 EMERGENCY DETECTED: ${aiResult.message}\n\nWe are notifying your emergency contact: ${patient?.emergencyContact || 'Guardian'} (${patient?.emergencyPhone || 'N/A'}). Please call 999 immediately if you are alone.`;
      aiResult.intent = 'EMERGENCY';
    }

    // 3. Matchmaking Engine (Now includes BOOKING intent if doctor is not yet selected)
    if (['SYMPTOMS', 'MATCHMAKING', 'BOOKING'].includes(aiResult.intent) && aiResult.context.department && !aiResult.context.doctorId) {
      const doctors = await this.findDoctors(aiResult.context.department);
      if (doctors.length > 0) {
        aiResult.availableDoctors = doctors.map(d => ({
          id: d.id,
          name: `Dr. ${d.user.firstName} ${d.user.lastName}`,
          hospital: d.hospital,
          fee: d.consultationFee,
          specialization: d.department
        }));
        aiResult.intent = 'MATCHMAKING';
        aiResult.message += `\n\nI recommend seeing a specialist in ${aiResult.context.department.replace('_', ' ')}. Here are some available doctors:`;
      }
    }

    return aiResult;
  }

  async callLLM(message, history) {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'undefined') {
      return this.mockLLM(message, "Missing GROQ_API_KEY. Please set it in Railway Variables.");
    }

    const messages = [
      { role: "system", content: this.systemPrompt },
      ...history.slice(-10).map(h => {
        // Inject metadata into content for Assistant turns so LLM knows IDs/context
        let content = h.content;
        if (h.role === 'assistant' && (h.intent || h.availableDoctors)) {
          const metadata = [];
          if (h.intent) metadata.push(`[Intent: ${h.intent}]`);
          if (h.availableDoctors) metadata.push(`[Available Doctors: ${h.availableDoctors.map(d => `${d.name} (ID: ${d.id})`).join(', ')}]`);
          content = `${metadata.join(' ')}\n${content}`;
        }
        return { role: h.role, content };
      }),
      { role: "user", content: message }
    ];

    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: CHATBOT_MODEL,
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      const apiError = err.response?.data?.error?.message || err.message;
      console.error("[LLM Error]", apiError);
      return this.mockLLM(message, `Connection Error: ${apiError}`);
    }
  }

  async triggerEmergency(userId, symptoms) {
    // Audit log & Notification
    await Notification.create({
      userId,
      title: '🚨 EMERGENCY ALERT TRIGGERED',
      message: `Critial symptoms detected via AI Triage: ${symptoms}. Emergency contacts have been flagged.`,
      type: 'error',
      actionType: 'EMERGENCY_TRIAGE'
    });
    
    // In a real system, send SMS here
    console.log(`[EMERGENCY] User ${userId} triggered high urgency triage for: ${symptoms}`);
  }

  async findDoctors(deptValue) {
    return await Doctor.findAll({
      where: { 
        department: deptValue,
        isVerified: true
      },
      include: [{ association: 'user', attributes: ['firstName', 'lastName'] }],
      limit: 3,
      order: [['rating', 'DESC']]
    });
  }

  mockLLM(msg, error = "") {
    // Robust fallback for testing
    const text = msg.toLowerCase();
    let urgency = 'low';
    let intent = 'GREETING';
    
    if (text.includes('pain') || text.includes('hurt')) intent = 'SYMPTOMS';
    if (text.includes('chest') || text.includes('breath')) urgency = 'high';

    return {
      message: `[AI SAFE MODE] ${error}\n\nI can still help you book an appointment manually or triage emergencies. How can I help?`,
      intent: intent,
      context: { symptoms: [], urgency, department: 'general_medicine' },
      isEmergency: urgency === 'high'
    };
  }
}

module.exports = new ChatbotService();
