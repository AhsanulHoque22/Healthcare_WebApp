/**
 * Role-based notification triggers for major actions.
 * Centralizes notification creation for admin, patient, and doctor roles.
 */
const { User } = require('../models');
const { createNotification } = require('./notificationService');
const { sendEmail } = require('./emailService');

// ============== EMAIL TEMPLATE HELPER ==============

/**
 * Build a consistent, branded Livora HTML email.
 * @param {string} title - Email heading
 * @param {string} bodyHtml - Inner HTML content (paragraphs, lists, etc.)
 * @returns {string} Full HTML email string
 */
const buildEmailHtml = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Livora</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Your Healthcare Partner</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 20px;color:#1a202c;font-size:22px;font-weight:600;">${title}</h2>
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#718096;font-size:12px;">
              &copy; ${new Date().getFullYear()} Livora Healthcare. All rights reserved.<br/>
              This is an automated message — please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// ============== CORE NOTIFY HELPER ==============

/**
 * Create notification(s) for one or more users
 * @param {Object} params
 * @param {number|number[]} params.userIds - Single userId or array of userIds
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.type - info|success|warning|error
 * @param {string} params.targetRole - patient|doctor|admin
 * @param {string} params.actionType - Trigger identifier (e.g. appointment_created)
 * @param {number} [params.entityId] - Related entity ID
 * @param {string} [params.entityType] - Related entity type (e.g. appointment, prescription)
 * @param {Object} [params.emailOptions] - Optional email options: { subject, html }
 */
const notifyUsers = async ({
  userIds,
  title,
  message,
  type = 'info',
  targetRole,
  actionType,
  entityId,
  entityType,
  emailOptions,
}) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const meta = { targetRole, actionType, entityId, entityType };
  for (const userId of ids) {
    if (!userId) continue;
    try {
      // 1. Create in-app notification
      await createNotification({
        userId,
        title,
        message,
        type,
        ...meta,
      });

      // 2. Send email if requested
      if (emailOptions) {
        const user = await User.findByPk(userId, { attributes: ['email', 'firstName'] });
        if (user && user.email) {
          sendEmail({
            to: user.email,
            subject: emailOptions.subject || title,
            html: emailOptions.html || buildEmailHtml(title, `
              <p style="color:#4a5568;line-height:1.7;margin:0 0 12px;">Hello ${user.firstName || ''},</p>
              <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">${message}</p>
              <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
            `)
          }).catch(err => console.error(`[notificationTriggers] Email failed for user ${userId}:`, err.message));
        }
      }
    } catch (err) {
      console.error(`[notificationTriggers] Failed to notify user ${userId}:`, err.message);
    }
  }
};

/**
 * Get all admin user IDs
 */
const getAdminUserIds = async () => {
  const admins = await User.findAll({
    where: { role: 'admin', isActive: true },
    attributes: ['id'],
  });
  return admins.map((a) => a.id);
};

// ============== APPOINTMENT TRIGGERS ==============

/** Patient: appointment booking confirmation */
const triggerAppointmentCreated = async (appointment, patient, doctor) => {
  const patientUser = patient?.user || patient;
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = appointment.appointmentTime ? String(appointment.appointmentTime).slice(0, 5) : '';

  const patientUserId = patient?.userId ?? patientUser?.id ?? (patient?.dataValues?.userId);
  const doctorUserId = doctor?.userId ?? doctorUser?.id ?? (doctor?.dataValues?.userId);

  if (patientUserId) {
    await notifyUsers({
      userIds: patientUserId,
      title: 'Appointment Requested',
      message: `Your appointment request with ${doctorName} on ${dateStr}${timeStr ? ` at ${timeStr}` : ''} has been submitted. Awaiting doctor approval.`,
      type: 'info',
      targetRole: 'patient',
      actionType: 'appointment_created',
      entityId: appointment.id,
      entityType: 'appointment',
      emailOptions: {
        subject: 'Appointment Request Submitted – Livora',
        html: buildEmailHtml('Appointment Request Submitted', `
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your appointment request has been received and is awaiting doctor approval.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7faff;border-radius:8px;padding:20px;margin:0 0 20px;">
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Doctor</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${doctorName}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Date</td><td style="padding:6px 0;color:#2d3748;">${dateStr}</td></tr>
            ${timeStr ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">Time</td><td style="padding:6px 0;color:#2d3748;">${timeStr}</td></tr>` : ''}
            ${appointment.type ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">Type</td><td style="padding:6px 0;color:#2d3748;text-transform:capitalize;">${String(appointment.type).replace('_', ' ')}</td></tr>` : ''}
          </table>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">You will receive another email once the doctor approves or declines your request. You can track your appointment status in your dashboard.</p>
          <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
        `)
      }
    });
  }

  if (doctorUserId) {
    await notifyUsers({
      userIds: doctorUserId,
      title: 'New Appointment Request',
      message: `You have a new appointment request for ${dateStr}${timeStr ? ` at ${timeStr}` : ''}. Please approve or decline.`,
      type: 'info',
      targetRole: 'doctor',
      actionType: 'appointment_request_received',
      entityId: appointment.id,
      entityType: 'appointment',
    });
  }
};

/** Patient: appointment approved by doctor */
const triggerAppointmentApproved = async (appointment, patient, doctor) => {
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = appointment.appointmentTime ? String(appointment.appointmentTime).slice(0, 5) : '';

  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Appointment Approved ✓',
    message: `Your appointment with ${doctorName} on ${dateStr} has been approved.`,
    type: 'success',
    targetRole: 'patient',
    actionType: 'appointment_approved',
    entityId: appointment.id,
    entityType: 'appointment',
    emailOptions: {
      subject: 'Appointment Confirmed – Livora',
      html: buildEmailHtml('Your Appointment is Confirmed! ✓', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Great news! Your appointment has been approved by the doctor.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fff4;border-left:4px solid #38a169;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Doctor</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${doctorName}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Date</td><td style="padding:6px 0;color:#2d3748;">${dateStr}</td></tr>
          ${timeStr ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">Time</td><td style="padding:6px 0;color:#2d3748;">${timeStr}</td></tr>` : ''}
          ${appointment.type ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">Type</td><td style="padding:6px 0;color:#2d3748;text-transform:capitalize;">${String(appointment.type).replace('_', ' ')}</td></tr>` : ''}
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Please make sure to arrive on time. You can view full appointment details in your Livora dashboard.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

/** Patient: appointment declined by doctor */
const triggerAppointmentDeclined = async (appointment, patient, doctor) => {
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Appointment Declined',
    message: `Your appointment with ${doctorName} on ${dateStr} was declined.`,
    type: 'warning',
    targetRole: 'patient',
    actionType: 'appointment_declined',
    entityId: appointment.id,
    entityType: 'appointment',
    emailOptions: {
      subject: 'Appointment Request Declined – Livora',
      html: buildEmailHtml('Appointment Request Declined', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Unfortunately, your appointment request has been declined by the doctor.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf0;border-left:4px solid #dd6b20;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Doctor</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${doctorName}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Requested Date</td><td style="padding:6px 0;color:#2d3748;">${dateStr}</td></tr>
          ${appointment.notes ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">Reason</td><td style="padding:6px 0;color:#2d3748;">${appointment.notes}</td></tr>` : ''}
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">You can book a new appointment with another available time slot or a different doctor through your Livora dashboard.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

/** Patient & Doctor: appointment cancelled */
const triggerAppointmentCancelled = async (appointment, patient, doctor, cancelledByRole) => {
  const patientUserId = patient?.userId || patient?.user?.id;
  const doctorUserId = doctor?.userId || doctor?.user?.id;
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const patientUser = patient?.user || patient;
  const patientName = patientUser ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim() : 'Patient';

  if (cancelledByRole !== 'patient' && patientUserId) {
    await notifyUsers({
      userIds: patientUserId,
      title: 'Appointment Cancelled',
      message: `Your appointment on ${dateStr} has been cancelled.`,
      type: 'warning',
      targetRole: 'patient',
      actionType: 'appointment_cancelled',
      entityId: appointment.id,
      entityType: 'appointment',
      emailOptions: {
        subject: 'Appointment Cancelled – Livora',
        html: buildEmailHtml('Appointment Cancelled', `
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your appointment has been cancelled.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border-left:4px solid #e53e3e;border-radius:4px;padding:20px;margin:0 0 20px;">
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Doctor</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${doctorName}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Date</td><td style="padding:6px 0;color:#2d3748;">${dateStr}</td></tr>
            ${appointment.notes ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">Reason</td><td style="padding:6px 0;color:#2d3748;">${appointment.notes}</td></tr>` : ''}
          </table>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">If you need medical assistance, please book a new appointment through your Livora dashboard.</p>
          <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
        `)
      }
    });
  }
  if (cancelledByRole !== 'doctor' && doctorUserId) {
    await notifyUsers({
      userIds: doctorUserId,
      title: 'Appointment Cancelled',
      message: `An appointment on ${dateStr} has been cancelled.`,
      type: 'warning',
      targetRole: 'doctor',
      actionType: 'appointment_cancelled',
      entityId: appointment.id,
      entityType: 'appointment',
      emailOptions: {
        subject: 'Appointment Cancelled – Livora',
        html: buildEmailHtml('Appointment Cancelled', `
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">An appointment in your schedule has been cancelled by the patient.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border-left:4px solid #e53e3e;border-radius:4px;padding:20px;margin:0 0 20px;">
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Patient</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${patientName}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Date</td><td style="padding:6px 0;color:#2d3748;">${dateStr}</td></tr>
          </table>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Your schedule has been updated. View your upcoming appointments in your Livora dashboard.</p>
          <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
        `)
      }
    });
  }
};

/** Patient & Doctor: appointment rescheduled */
const triggerAppointmentRescheduled = async (appointment, patient, doctor) => {
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const patientUser = patient?.user || patient;
  const patientName = patientUser ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim() : 'Patient';
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = appointment.appointmentTime ? String(appointment.appointmentTime).slice(0, 5) : '';

  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Appointment Rescheduled',
    message: `Your appointment with ${doctorName} has been rescheduled to ${dateStr}.`,
    type: 'info',
    targetRole: 'patient',
    actionType: 'appointment_rescheduled',
    entityId: appointment.id,
    entityType: 'appointment',
    emailOptions: {
      subject: 'Appointment Rescheduled – Livora',
      html: buildEmailHtml('Your Appointment Has Been Rescheduled', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your appointment has been rescheduled to a new date and time.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ebf8ff;border-left:4px solid #3182ce;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Doctor</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${doctorName}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">New Date</td><td style="padding:6px 0;color:#2d3748;">${dateStr}</td></tr>
          ${timeStr ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">New Time</td><td style="padding:6px 0;color:#2d3748;">${timeStr}</td></tr>` : ''}
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Please make note of the new date and time. View full details in your Livora dashboard.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });

  await notifyUsers({
    userIds: doctor?.userId || doctor?.user?.id,
    title: 'Appointment Rescheduled',
    message: `An appointment has been rescheduled to ${dateStr}.`,
    type: 'info',
    targetRole: 'doctor',
    actionType: 'appointment_rescheduled',
    entityId: appointment.id,
    entityType: 'appointment',
    emailOptions: {
      subject: 'Appointment Rescheduled – Livora',
      html: buildEmailHtml('Appointment Rescheduled', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">An appointment in your schedule has been rescheduled.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ebf8ff;border-left:4px solid #3182ce;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Patient</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${patientName}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">New Date</td><td style="padding:6px 0;color:#2d3748;">${dateStr}</td></tr>
          ${timeStr ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">New Time</td><td style="padding:6px 0;color:#2d3748;">${timeStr}</td></tr>` : ''}
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Your updated schedule is available in your Livora dashboard.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

/** Patient: appointment started (doctor begins consultation) */
const triggerAppointmentStarted = async (appointment, patient, doctor) => {
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const timeStr = appointment.appointmentTime ? String(appointment.appointmentTime).slice(0, 5) : '';

  const patientUserId = patient?.userId ?? patient?.user?.id;
  if (patientUserId) {
    await notifyUsers({
      userIds: patientUserId,
      title: 'Appointment Started',
      message: `Your appointment with ${doctorName} has started${timeStr ? ` at ${timeStr}` : ''}. The doctor is now seeing you.`,
      type: 'info',
      targetRole: 'patient',
      actionType: 'appointment_started',
      entityId: appointment.id,
      entityType: 'appointment',
    });
  }

  const doctorUserId = doctor?.userId ?? doctor?.user?.id;
  if (doctorUserId) {
    await notifyUsers({
      userIds: doctorUserId,
      title: 'Appointment In Progress',
      message: `Your appointment is now in progress.`,
      type: 'info',
      targetRole: 'doctor',
      actionType: 'appointment_started',
      entityId: appointment.id,
      entityType: 'appointment',
    });
  }
};

/** Patient & Doctor: appointment completed */
const triggerAppointmentCompleted = async (appointment, patient, doctor) => {
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const patientUserId = patient?.userId ?? patient?.user?.id;
  const doctorUserId = doctor?.userId ?? doctor?.user?.id;
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (patientUserId) {
    await notifyUsers({
      userIds: patientUserId,
      title: 'Appointment Completed',
      message: `Your appointment with ${doctorName} has been completed. You can view your prescription in your dashboard.`,
      type: 'success',
      targetRole: 'patient',
      actionType: 'appointment_completed',
      entityId: appointment.id,
      entityType: 'appointment',
      emailOptions: {
        subject: 'Appointment Completed – Livora',
        html: buildEmailHtml('Appointment Completed', `
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your appointment has been successfully completed. We hope you are feeling better!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fff4;border-left:4px solid #38a169;border-radius:4px;padding:20px;margin:0 0 20px;">
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Doctor</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${doctorName}</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Date</td><td style="padding:6px 0;color:#2d3748;">${dateStr}</td></tr>
          </table>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 12px;">Your prescription and medical records (if issued) are available in your Livora dashboard. Please follow your doctor's instructions carefully.</p>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">If you found the consultation helpful, please consider leaving a rating for your doctor.</p>
          <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
        `)
      }
    });
  }

  if (doctorUserId) {
    await notifyUsers({
      userIds: doctorUserId,
      title: 'Appointment Completed',
      message: 'Appointment has been marked as completed.',
      type: 'success',
      targetRole: 'doctor',
      actionType: 'appointment_completed',
      entityId: appointment.id,
      entityType: 'appointment',
    });
  }
};

// ============== PRESCRIPTION TRIGGERS ==============

/** Patient: prescription created/updated */
const triggerPrescriptionCreated = async (prescription, patient, doctor) => {
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';

  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Prescription Ready',
    message: `Your prescription from ${doctorName} is ready. View details in your dashboard.`,
    type: 'success',
    targetRole: 'patient',
    actionType: 'prescription_created',
    entityId: prescription.id,
    entityType: 'prescription',
    emailOptions: {
      subject: 'Your Prescription is Ready – Livora',
      html: buildEmailHtml('Your Prescription is Ready', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">A new prescription has been issued for you.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fff4;border-left:4px solid #38a169;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Prescribed by</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${doctorName}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Date</td><td style="padding:6px 0;color:#2d3748;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">You can view, download, and share your prescription by logging into your Livora account. Please follow all dosage instructions provided by your doctor.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

// ============== MEDICINE REMINDER TRIGGERS ==============

/** Patient: medicine reminder - take your medicine */
const triggerMedicineReminder = async (patientUserId, medicineName, dosage, reminderTime) => {
  if (!patientUserId) return;
  const timeStr = reminderTime ? String(reminderTime).slice(0, 5) : '';
  await notifyUsers({
    userIds: patientUserId,
    title: 'Medicine Reminder',
    message: `Time to take ${medicineName}${dosage ? ` (${dosage})` : ''}${timeStr ? ` at ${timeStr}` : ''}.`,
    type: 'info',
    targetRole: 'patient',
    actionType: 'medicine_reminder',
    entityType: 'medicine',
  });
};

// ============== LAB TEST TRIGGERS ==============

/** Patient: lab test order created */
const triggerLabOrderCreated = async (order, patient) => {
  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Lab Test Order Placed',
    message: `Your lab test order #${order.id} has been placed. Complete payment to proceed.`,
    type: 'info',
    targetRole: 'patient',
    actionType: 'lab_order_created',
    entityId: order.id,
    entityType: 'lab_order',
    emailOptions: {
      subject: 'Lab Test Order Confirmed – Livora',
      html: buildEmailHtml('Lab Test Order Confirmed', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your lab test order has been successfully placed.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ebf8ff;border-left:4px solid #3182ce;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Order ID</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">#${order.id}</td></tr>
          ${order.totalAmount ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;">Total Amount</td><td style="padding:6px 0;color:#2d3748;">৳${parseFloat(order.totalAmount).toFixed(2)}</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Status</td><td style="padding:6px 0;color:#d97706;font-weight:600;">Awaiting Payment</td></tr>
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Please complete your payment through your Livora dashboard to proceed with sample collection. Our team will contact you once the payment is confirmed.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

/** Admin: new lab test order (for processing) */
const triggerLabOrderCreatedAdmin = async (order) => {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) return;
  await notifyUsers({
    userIds: adminIds,
    title: 'New Lab Test Order',
    message: `New lab test order #${order.id} has been placed. Process samples and update status.`,
    type: 'info',
    targetRole: 'admin',
    actionType: 'lab_order_created',
    entityId: order.id,
    entityType: 'lab_order',
  });
};

/** Patient: lab test results ready */
const triggerLabResultsReady = async (order, patient) => {
  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Lab Results Ready',
    message: `Your lab test results for order #${order.id} are now available for review.`,
    type: 'success',
    targetRole: 'patient',
    actionType: 'lab_results_ready',
    entityId: order.id,
    entityType: 'lab_order',
    emailOptions: {
      subject: 'Your Lab Test Results Are Ready – Livora',
      html: buildEmailHtml('Your Lab Results Are Ready! 🔬', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Good news! Your lab test results have been processed and are now available for review.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fff4;border-left:4px solid #38a169;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Order ID</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">#${order.id}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Available</td><td style="padding:6px 0;color:#38a169;font-weight:600;">Ready to View</td></tr>
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Log in to your Livora account to view and download your lab results. We recommend discussing your results with your doctor if you have any concerns.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

/** Patient: prescription lab test results confirmed */
const triggerPrescriptionLabResultsReady = async (prescription, patient, testName) => {
  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Lab Results Ready',
    message: `Your lab test results for ${testName || 'prescription tests'} are now available for review.`,
    type: 'success',
    targetRole: 'patient',
    actionType: 'lab_results_ready',
    entityId: prescription?.id,
    entityType: 'prescription',
    emailOptions: {
      subject: 'Lab Results Ready – Livora',
      html: buildEmailHtml('Your Lab Results Are Ready! 🔬', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your lab test results are now available.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fff4;border-left:4px solid #38a169;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Test</td><td style="padding:6px 0;color:#2d3748;font-weight:600;">${testName || 'Prescription Lab Tests'}</td></tr>
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Status</td><td style="padding:6px 0;color:#38a169;font-weight:600;">Ready to View</td></tr>
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Log in to your Livora account to view and download your results. Please consult your doctor if you have any questions about your results.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

// ============== ADMIN TRIGGERS ==============

/** Admin: new doctor verification request */
const triggerDoctorVerificationRequest = async () => {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) return;
  await notifyUsers({
    userIds: adminIds,
    title: 'New Doctor Verification Request',
    message: 'A new doctor has requested verification. Review in the admin dashboard.',
    type: 'info',
    targetRole: 'admin',
    actionType: 'doctor_verification_request',
  });
};

/** Doctor: verification status changed */
const triggerDoctorVerified = async (doctor, isVerified) => {
  const doctorUserId = doctor?.userId || doctor?.user?.id;
  if (!doctorUserId) return;
  await notifyUsers({
    userIds: doctorUserId,
    title: isVerified ? 'Account Verified ✓' : 'Verification Reverted',
    message: isVerified
      ? 'Your doctor account has been verified. You can now receive appointment requests.'
      : 'Your doctor verification has been reverted. Contact admin for details.',
    type: isVerified ? 'success' : 'warning',
    targetRole: 'doctor',
    actionType: 'doctor_verification_changed',
    entityId: doctor.id,
    entityType: 'doctor',
    emailOptions: {
      subject: isVerified ? 'Your Doctor Account is Now Verified – Livora' : 'Account Verification Status Updated – Livora',
      html: isVerified
        ? buildEmailHtml('Your Account is Verified! 🎉', `
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Congratulations! Your doctor account has been reviewed and approved by the Livora admin team.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fff4;border-left:4px solid #38a169;border-radius:4px;padding:20px;margin:0 0 20px;">
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:160px;">Status</td><td style="padding:6px 0;color:#38a169;font-weight:700;">✓ Verified</td></tr>
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;">Verified On</td><td style="padding:6px 0;color:#2d3748;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          </table>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 12px;">You can now:</p>
          <ul style="color:#4a5568;line-height:1.9;margin:0 0 20px;padding-left:20px;">
            <li>Receive appointment requests from patients</li>
            <li>Manage your schedule and availability</li>
            <li>Issue prescriptions and lab test orders</li>
          </ul>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Log in to your Livora dashboard to complete your profile and start accepting patients.</p>
          <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
        `)
        : buildEmailHtml('Account Verification Status Updated', `
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your doctor verification status has been updated by the Livora admin team.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf0;border-left:4px solid #dd6b20;border-radius:4px;padding:20px;margin:0 0 20px;">
            <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:160px;">Status</td><td style="padding:6px 0;color:#dd6b20;font-weight:700;">Verification Reverted</td></tr>
          </table>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Your account has been placed under review. You may not be able to receive new appointment requests until the matter is resolved. Please contact the Livora admin team for more information.</p>
          <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
        `)
    }
  });
};

/** Admin: user deactivated */
const triggerUserDeactivated = async (user) => {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) return;
  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  await notifyUsers({
    userIds: adminIds,
    title: 'User Deactivated',
    message: `User ${userName} (${user.role}) has been deactivated.`,
    type: 'warning',
    targetRole: 'admin',
    actionType: 'user_deactivated',
    entityId: user.id,
    entityType: 'user',
  });
};

/** Admin: new user registration (doctor/patient) */
const triggerNewUserRegistration = async (user) => {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) return;
  const roleLabel = user.role === 'doctor' ? 'doctor' : 'patient';
  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  await notifyUsers({
    userIds: adminIds,
    title: `New ${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)} Registered`,
    message: `${userName} has registered as a ${roleLabel}.`,
    type: 'info',
    targetRole: 'admin',
    actionType: 'user_registered',
    entityId: user.id,
    entityType: 'user',
  });
};

// ============== RATING TRIGGERS ==============

/** Doctor: new rating received */
const triggerDoctorRatingReceived = async (rating, doctor) => {
  const doctorUserId = doctor?.userId || doctor?.user?.id;
  if (!doctorUserId) return;
  await notifyUsers({
    userIds: doctorUserId,
    title: 'New Rating Received',
    message: `You received a ${rating.rating}-star rating. ${rating.review ? 'A review was also submitted.' : ''}`,
    type: 'info',
    targetRole: 'doctor',
    actionType: 'rating_received',
    entityId: rating.id,
    entityType: 'rating',
    emailOptions: {
      subject: 'You Received a New Patient Rating – Livora',
      html: buildEmailHtml('New Patient Rating Received', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">A patient has submitted a rating for your consultation.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefcbf;border-left:4px solid #d69e2e;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#718096;font-size:14px;width:140px;">Rating</td><td style="padding:6px 0;color:#2d3748;font-weight:700;font-size:18px;">${'⭐'.repeat(Math.min(rating.rating, 5))} (${rating.rating}/5)</td></tr>
          ${rating.review ? `<tr><td style="padding:6px 0;color:#718096;font-size:14px;vertical-align:top;">Review</td><td style="padding:6px 0;color:#2d3748;font-style:italic;">"${rating.review}"</td></tr>` : ''}
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Patient feedback helps us ensure the highest quality of care. View all your ratings in your Livora dashboard.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

/** Admin: new rating (for moderation) */
const triggerDoctorRatingReceivedAdmin = async (rating) => {
  const adminIds = await getAdminUserIds();
  if (adminIds.length === 0) return;
  await notifyUsers({
    userIds: adminIds,
    title: 'New Doctor Rating',
    message: 'A new doctor rating has been submitted. Review for moderation if needed.',
    type: 'info',
    targetRole: 'admin',
    actionType: 'rating_submitted',
    entityId: rating.id,
    entityType: 'rating',
  });
};

// ============== AUTH TRIGGERS ==============

/** Patient: welcome on registration */
const triggerWelcomePatient = async (user) => {
  await notifyUsers({
    userIds: user.id,
    title: 'Welcome to Livora!',
    message: 'Thank you for joining. Your account has been created. Book appointments and manage your health easily.',
    type: 'success',
    targetRole: 'patient',
    actionType: 'user_registered',
    emailOptions: {
      subject: 'Welcome to Livora! 🏥',
      html: buildEmailHtml('Welcome to Livora! 🏥', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Hello ${user.firstName || ''},</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">We're thrilled to have you on board. Your Livora account has been successfully created!</p>
        <p style="color:#4a5568;font-weight:600;margin:0 0 8px;">Here's what you can do with Livora:</p>
        <ul style="color:#4a5568;line-height:1.9;margin:0 0 20px;padding-left:20px;">
          <li>Book appointments with verified doctors</li>
          <li>View your medical history and prescriptions</li>
          <li>Order and track lab tests</li>
          <li>Set medicine reminders</li>
        </ul>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

/** Doctor: welcome on registration */
const triggerWelcomeDoctor = async (user) => {
  await notifyUsers({
    userIds: user.id,
    title: 'Welcome, Doctor!',
    message: 'Your account has been created. Complete your profile and submit for verification to start receiving appointments.',
    type: 'success',
    targetRole: 'doctor',
    actionType: 'user_registered',
    emailOptions: {
      subject: 'Welcome to the Livora Medical Team! 👨‍⚕️',
      html: buildEmailHtml('Welcome to the Livora Medical Team! 👨‍⚕️', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Hello Dr. ${user.firstName || ''},</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Thank you for joining the Livora medical team. Your doctor account has been successfully created.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ebf8ff;border-left:4px solid #3182ce;border-radius:4px;padding:20px;margin:0 0 20px;">
          <tr><td style="padding:6px 0;color:#2d3748;font-size:14px;"><strong>Next Steps:</strong></td></tr>
          <tr><td style="padding:4px 0;color:#4a5568;font-size:14px;">1. Complete your professional profile (specialization, experience, bio)</td></tr>
          <tr><td style="padding:4px 0;color:#4a5568;font-size:14px;">2. Submit your profile for admin verification</td></tr>
          <tr><td style="padding:4px 0;color:#4a5568;font-size:14px;">3. Once verified, start receiving patient appointments</td></tr>
        </table>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">Our admin team will review your credentials and verify your account within 1–2 business days. You'll receive an email notification once verified.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }
  });
};

/** Patient & Doctor: daily reminder for appointments scheduled today */
const triggerDailyAppointmentReminders = async () => {
  const { Appointment } = require('../models');
  const { Op } = require('sequelize');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.findAll({
    where: {
      appointmentDate: { [Op.gte]: today, [Op.lt]: tomorrow },
      status: { [Op.in]: ['scheduled', 'confirmed'] },
    },
    include: [
      { association: 'patient', include: [{ association: 'user', attributes: ['id', 'firstName', 'lastName'] }] },
      { association: 'doctor', include: [{ association: 'user', attributes: ['id', 'firstName', 'lastName'] }] },
    ],
  });

  const patientAppointments = new Map();
  const doctorAppointmentCounts = new Map();

  for (const apt of appointments) {
    const patient = apt.patient;
    const doctor = apt.doctor;
    const patientUserId = patient?.userId ?? patient?.user?.id;
    const doctorUserId = doctor?.userId ?? doctor?.user?.id;
    const doctorName = doctor?.user ? `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim() : 'Doctor';
    const timeStr = apt.appointmentTime ? String(apt.appointmentTime).slice(0, 5) : '';

    if (patientUserId) {
      const list = patientAppointments.get(patientUserId) || [];
      list.push({ doctorName, timeStr });
      patientAppointments.set(patientUserId, list);
    }
    if (doctorUserId) {
      doctorAppointmentCounts.set(doctorUserId, (doctorAppointmentCounts.get(doctorUserId) || 0) + 1);
    }
  }

  for (const [patientUserId, list] of patientAppointments) {
    const apt = list[0];
    const msg = list.length === 1
      ? `You have an appointment with ${apt.doctorName} today${apt.timeStr ? ` at ${apt.timeStr}` : ''}. Please be on time.`
      : `You have ${list.length} appointments scheduled for today. Please be on time.`;
    await notifyUsers({
      userIds: patientUserId,
      title: "Today's Appointment Reminder",
      message: msg,
      type: 'info',
      targetRole: 'patient',
      actionType: 'daily_appointment_reminder',
      entityType: 'appointment',
    });
  }

  for (const [doctorUserId, count] of doctorAppointmentCounts) {
    await notifyUsers({
      userIds: doctorUserId,
      title: "Today's Appointments",
      message: count === 1
        ? 'You have 1 appointment scheduled for today.'
        : `You have ${count} appointments scheduled for today.`,
      type: 'info',
      targetRole: 'doctor',
      actionType: 'daily_appointment_reminder',
      entityType: 'appointment',
    });
  }
};

module.exports = {
  notifyUsers,
  getAdminUserIds,
  buildEmailHtml,
  triggerAppointmentCreated,
  triggerAppointmentApproved,
  triggerAppointmentStarted,
  triggerAppointmentDeclined,
  triggerAppointmentCancelled,
  triggerAppointmentRescheduled,
  triggerAppointmentCompleted,
  triggerPrescriptionCreated,
  triggerLabOrderCreated,
  triggerLabOrderCreatedAdmin,
  triggerLabResultsReady,
  triggerPrescriptionLabResultsReady,
  triggerDoctorVerificationRequest,
  triggerDoctorVerified,
  triggerUserDeactivated,
  triggerNewUserRegistration,
  triggerDoctorRatingReceived,
  triggerDoctorRatingReceivedAdmin,
  triggerWelcomePatient,
  triggerWelcomeDoctor,
  triggerDailyAppointmentReminders,
  triggerMedicineReminder,
};
