/**
 * Role-based notification triggers for major actions.
 * Centralizes notification creation for admin, patient, and doctor roles.
 */
const { User } = require('../models');
const { createNotification } = require('./notificationService');

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
}) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const meta = { targetRole, actionType, entityId, entityType };
  for (const userId of ids) {
    if (!userId) continue;
    try {
      await createNotification({
        userId,
        title,
        message,
        type,
        ...meta,
      });
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
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();
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
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();

  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Appointment Approved',
    message: `Your appointment with ${doctorName} on ${dateStr} has been approved.`,
    type: 'success',
    targetRole: 'patient',
    actionType: 'appointment_approved',
    entityId: appointment.id,
    entityType: 'appointment',
  });
};

/** Patient: appointment declined by doctor */
const triggerAppointmentDeclined = async (appointment, patient, doctor) => {
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();

  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Appointment Declined',
    message: `Your appointment with ${doctorName} on ${dateStr} was declined.`,
    type: 'warning',
    targetRole: 'patient',
    actionType: 'appointment_declined',
    entityId: appointment.id,
    entityType: 'appointment',
  });
};

/** Patient & Doctor: appointment cancelled */
const triggerAppointmentCancelled = async (appointment, patient, doctor, cancelledByRole) => {
  const patientUserId = patient?.userId || patient?.user?.id;
  const doctorUserId = doctor?.userId || doctor?.user?.id;
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();

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
    });
  }
};

/** Patient & Doctor: appointment rescheduled */
const triggerAppointmentRescheduled = async (appointment, patient, doctor) => {
  const doctorUser = doctor?.user || doctor;
  const doctorName = doctorUser ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() : 'Doctor';
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();

  await notifyUsers({
    userIds: patient?.userId || patient?.user?.id,
    title: 'Appointment Rescheduled',
    message: `Your appointment with ${doctorName} has been rescheduled to ${dateStr}.`,
    type: 'info',
    targetRole: 'patient',
    actionType: 'appointment_rescheduled',
    entityId: appointment.id,
    entityType: 'appointment',
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
    title: isVerified ? 'Account Verified' : 'Verification Reverted',
    message: isVerified
      ? 'Your doctor account has been verified. You can now receive appointment requests.'
      : 'Your doctor verification has been reverted. Contact admin for details.',
    type: isVerified ? 'success' : 'warning',
    targetRole: 'doctor',
    actionType: 'doctor_verification_changed',
    entityId: doctor.id,
    entityType: 'doctor',
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
    title: 'Welcome to HealthCare Pro!',
    message: 'Thank you for joining. Your account has been created. Book appointments and manage your health easily.',
    type: 'success',
    targetRole: 'patient',
    actionType: 'user_registered',
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
};
