'use strict';

const { EscalationRequest, Notification, User } = require('../models');

class EscalationController {

  async createEscalation(req, res, next) {
    try {
      const { conversationId, chatHistoryId, userMessage, aiResponse } = req.body;
      const userId = req.user.id;

      if (!userMessage || !userMessage.trim()) {
        return res.status(400).json({ success: false, message: 'userMessage is required' });
      }
      if (!aiResponse || !aiResponse.trim()) {
        return res.status(400).json({ success: false, message: 'aiResponse is required' });
      }

      const escalation = await EscalationRequest.create({
        userId,
        conversationId: conversationId || null,
        chatHistoryId: chatHistoryId || null,
        userMessage: userMessage.trim().substring(0, 2000),
        aiResponse: aiResponse.trim().substring(0, 5000),
      });

      // Notify all admins
      const admins = await User.findAll({ where: { role: 'admin', isActive: true }, attributes: ['id'] });
      const adminNotifications = admins.map(admin => ({
        userId: admin.id,
        title: 'Human Review Requested',
        message: `A patient has requested human review of an AI response. Query: "${userMessage.trim().substring(0, 120)}${userMessage.length > 120 ? '…' : ''}"`,
        type: 'warning',
        targetRole: 'admin',
        actionType: 'ESCALATION_REQUEST',
        entityId: escalation.id,
        entityType: 'escalation_request',
      }));
      if (adminNotifications.length) await Notification.bulkCreate(adminNotifications);

      // Confirm to the patient
      await Notification.create({
        userId,
        title: 'Review Request Submitted',
        message: 'Your request for human review has been submitted. A healthcare professional will review your query shortly.',
        type: 'info',
        targetRole: 'patient',
        actionType: 'ESCALATION_SUBMITTED',
        entityId: escalation.id,
        entityType: 'escalation_request',
      });

      console.log(`[AUDIT] ESCALATION_REQUEST userId=${userId} escalationId=${escalation.id}`);

      return res.status(201).json({ success: true, data: { id: escalation.id, status: escalation.status } });
    } catch (error) {
      next(error);
    }
  }

  async getEscalations(req, res, next) {
    try {
      const { status } = req.query;
      const where = {};
      if (status && ['pending', 'assigned', 'resolved'].includes(status)) {
        where.status = status;
      }

      const escalations = await EscalationRequest.findAll({
        where,
        order: [['created_at', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      });

      return res.json({ success: true, data: escalations });
    } catch (error) {
      next(error);
    }
  }

  async updateEscalation(req, res, next) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (status && !['pending', 'assigned', 'resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'status must be pending, assigned, or resolved' });
      }

      const escalation = await EscalationRequest.findByPk(id);
      if (!escalation) {
        return res.status(404).json({ success: false, message: 'Escalation not found' });
      }

      const updates = {};
      if (status) updates.status = status;
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      await escalation.update(updates);

      // Notify the patient when their query is resolved
      if (status === 'resolved') {
        await Notification.create({
          userId: escalation.userId,
          title: 'Your Query Has Been Reviewed',
          message: adminNotes
            ? `A healthcare professional has reviewed your query and left a note: "${adminNotes.substring(0, 200)}"`
            : 'A healthcare professional has reviewed your query. Please check with your care team for follow-up.',
          type: 'success',
          targetRole: 'patient',
          actionType: 'ESCALATION_RESOLVED',
          entityId: escalation.id,
          entityType: 'escalation_request',
        });
      }

      return res.json({ success: true, data: escalation });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EscalationController();
