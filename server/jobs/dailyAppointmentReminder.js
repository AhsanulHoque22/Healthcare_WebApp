/**
 * Sends daily appointment reminders to patients and doctors.
 * Runs once per day at the configured hour (default 7 AM).
 */
const { triggerDailyAppointmentReminders } = require('../services/notificationTriggers');

const REMINDER_HOUR = parseInt(process.env.DAILY_REMINDER_HOUR || '7', 10);
let lastReminderDate = null;

const runDailyReminders = async () => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (lastReminderDate === today) return;
  if (now.getHours() !== REMINDER_HOUR) return;

  lastReminderDate = today;
  try {
    await triggerDailyAppointmentReminders();
    console.log(`[dailyAppointmentReminder] Sent reminders for ${today}`);
  } catch (err) {
    console.error('[dailyAppointmentReminder] Error:', err.message);
    lastReminderDate = null;
  }
};

const startDailyReminderScheduler = () => {
  setInterval(runDailyReminders, 60 * 60 * 1000);
  runDailyReminders();
};

module.exports = { startDailyReminderScheduler };
