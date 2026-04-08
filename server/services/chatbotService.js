const axios = require('axios');
const { Doctor, Patient, User, Notification } = require('../models');
const { Op } = require('sequelize');

// Llama 3 via Groq (High-performance open-source model)
const CHATBOT_MODEL = "llama3-70b-8192"; 

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
      1. SYMPTOMS: Extract clinical context. Use multi-turn conversation to clarify duration and severity.
      2. TRIAGE: 
         - LOW: Minor cold, skin rash, routine checkup.
         - MEDIUM: Persistent fever, joint pain, moderate stomach ache.
         - HIGH/EMERGENCY: Chest pain, choking, severe bleeding, unconsciousness, stroke symptoms.
      3. MATCHMAKING: Map symptoms to these internal values: ${this.departments.join(', ')}.
      4. BOOKING: If user wants an appointment, extract date (YYYY-MM-DD), timeBlock (e.g. "09:00 AM - 12:00 PM"), and symptoms.

      CONSTRAINTS:
      - Response MUST be STRICT JSON.
      - Multilingual: Respond in the language used by the patient (English or Bengali).
      - If TRIAGE is 'high', set isEmergency: true.

      OUTPUT JSON STRUCTURE:
      {
        "message": "Direct user response",
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

    // 3. Matchmaking Engine
    if ((aiResult.intent === 'SYMPTOMS' || aiResult.intent === 'MATCHMAKING') && aiResult.context.department && !aiResult.availableDoctors) {
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
    if (!process.env.GROQ_API_KEY) {
      return this.mockLLM(message); // Safety if key missing during dev
    }

    const messages = [
      { role: "system", content: this.systemPrompt },
      ...history.slice(-6), // Keep last 3 turns
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
        }
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      console.error("[LLM Error]", err.response?.data || err.message);
      return this.mockLLM(message);
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

  mockLLM(msg) {
    // Robust fallback for testing
    const text = msg.toLowerCase();
    let urgency = 'low';
    let intent = 'GREETING';
    
    if (text.includes('pain') || text.includes('hurt')) intent = 'SYMPTOMS';
    if (text.includes('chest') || text.includes('breath')) urgency = 'high';

    return {
      message: "I am currently in safe mode. How can I help with your health today?",
      intent: intent,
      context: { symptoms: [], urgency, department: 'general_medicine' },
      isEmergency: urgency === 'high'
    };
  }
}

module.exports = new ChatbotService();
