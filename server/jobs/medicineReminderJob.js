/**
 * Sends medicine reminders to patients at scheduled times.
 * Runs every 5 minutes to check for due reminders.
 */
const { MedicineReminder, Medicine, Patient, PatientReminderSettings } = require('../models');
const { Op } = require('sequelize');
const { triggerMedicineReminder } = require('../services/notificationTriggers');

const WINDOW_MINUTES = 5;

/**
 * Calculate next trigger time from reminderTime and daysOfWeek
 */
function getNextTrigger(reminderTime, daysOfWeek) {
  const now = new Date();
  let timeStr = reminderTime;
  if (typeof reminderTime === 'object' && reminderTime && reminderTime.getHours !== undefined) {
    timeStr = `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`;
  } else if (typeof reminderTime === 'string') {
    timeStr = reminderTime.slice(0, 5);
  } else {
    timeStr = '08:00';
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  const days = Array.isArray(daysOfWeek) ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
  const today = now.getDay();

  for (let i = 0; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(hours, minutes || 0, 0, 0);
    if (days.includes(d.getDay()) && d > now) return d;
  }
  return null;
}

/**
 * Check if a reminder is due (nextTrigger passed or we're in the time window with null nextTrigger)
 */
function isReminderDue(reminder, now) {
  if (reminder.nextTrigger && new Date(reminder.nextTrigger) <= now) return true;
  if (reminder.nextTrigger) return false;
  const rt = reminder.reminderTime;
  let h = 8, m = 0;
  if (rt) {
    const parts = String(rt).split(':');
    h = parseInt(parts[0], 10) || 8;
    m = parseInt(parts[1], 10) || 0;
  }
  const reminderToday = new Date(now);
  reminderToday.setHours(h, m, 0, 0);
  const windowEnd = new Date(reminderToday.getTime() + WINDOW_MINUTES * 60 * 1000);
  const days = Array.isArray(reminder.daysOfWeek) ? reminder.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
  if (!days.includes(now.getDay())) return false;
  return now >= reminderToday && now <= windowEnd;
}

async function runMedicineReminders() {
  const now = new Date();

  const reminders = await MedicineReminder.findAll({
    where: {
      isActive: true,
      [Op.or]: [
        { nextTrigger: { [Op.lte]: now } },
        { nextTrigger: null },
      ],
    },
    include: [
      { model: Medicine, as: 'medicine', where: { isActive: true }, required: true },
      { model: Patient, as: 'patient', attributes: ['id', 'userId'] },
    ],
  });

  for (const reminder of reminders) {
    if (!reminder.medicine || !reminder.patient) continue;
    if (!isReminderDue(reminder, now)) continue;

    const patient = reminder.patient;
    const patientUserId = patient?.userId;
    if (!patientUserId) continue;

    const settings = await PatientReminderSettings.findOne({
      where: { patientId: reminder.patientId },
    });
    if (settings && settings.notificationEnabled === false) continue;

    try {
      await triggerMedicineReminder(
        patientUserId,
        reminder.medicine.medicineName,
        reminder.medicine.dosage,
        reminder.reminderTime
      );
      const next = getNextTrigger(reminder.reminderTime, reminder.daysOfWeek);
      await reminder.update({
        lastTriggered: now,
        nextTrigger: next,
      });
    } catch (err) {
      console.error('[medicineReminderJob] Error for reminder', reminder.id, err.message);
    }
  }
}

function startMedicineReminderJob() {
  const intervalMs = 5 * 60 * 1000;
  setInterval(runMedicineReminders, intervalMs);
  runMedicineReminders();
}

module.exports = { startMedicineReminderJob, runMedicineReminders };
