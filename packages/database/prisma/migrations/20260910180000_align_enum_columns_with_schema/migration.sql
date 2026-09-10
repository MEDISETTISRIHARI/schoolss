-- Align PostgreSQL enum-backed columns with the current Prisma String fields.

ALTER TABLE "User"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT,
  ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

ALTER TABLE "User"
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TABLE "Attendance"
  ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

ALTER TABLE "Examination"
  ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

ALTER TABLE "Result"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Result"
  ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

ALTER TABLE "Result"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "Award"
  ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

ALTER TABLE "RolePermission"
  ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;

DROP TYPE "UserRole";
DROP TYPE "UserStatus";
DROP TYPE "AttendanceStatus";
DROP TYPE "ExaminationType";
DROP TYPE "ResultStatus";
DROP TYPE "AwardType";
DROP TYPE "NotificationType";
