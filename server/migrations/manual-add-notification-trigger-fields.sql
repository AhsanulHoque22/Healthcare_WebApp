-- Manual SQL to add notification trigger fields (run if migration fails)
-- Add role-based notification columns for triggers

ALTER TABLE notifications
  ADD COLUMN targetRole VARCHAR(20) NULL AFTER isRead,
  ADD COLUMN actionType VARCHAR(100) NULL AFTER targetRole,
  ADD COLUMN entityId INT NULL AFTER actionType,
  ADD COLUMN entityType VARCHAR(50) NULL AFTER entityId;

CREATE INDEX notifications_target_role ON notifications(targetRole);
CREATE INDEX notifications_action_type ON notifications(actionType);
