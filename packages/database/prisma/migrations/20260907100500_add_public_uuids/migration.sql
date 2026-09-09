-- Add publicId to School
ALTER TABLE "School" ADD COLUMN "publicId" TEXT;
UPDATE "School" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "School" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "School_publicId_key" ON "School"("publicId");

-- Add publicId to User
ALTER TABLE "User" ADD COLUMN "publicId" TEXT;
UPDATE "User" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");

-- Add publicId to Student
ALTER TABLE "Student" ADD COLUMN "publicId" TEXT;
UPDATE "Student" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Student" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Student_publicId_key" ON "Student"("publicId");

-- Add publicId to Teacher
ALTER TABLE "Teacher" ADD COLUMN "publicId" TEXT;
UPDATE "Teacher" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Teacher" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Teacher_publicId_key" ON "Teacher"("publicId");

-- Add publicId to AcademicYear
ALTER TABLE "AcademicYear" ADD COLUMN "publicId" TEXT;
UPDATE "AcademicYear" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "AcademicYear" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "AcademicYear_publicId_key" ON "AcademicYear"("publicId");

-- Add publicId to Class
ALTER TABLE "Class" ADD COLUMN "publicId" TEXT;
UPDATE "Class" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Class" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Class_publicId_key" ON "Class"("publicId");

-- Add publicId to Section
ALTER TABLE "Section" ADD COLUMN "publicId" TEXT;
UPDATE "Section" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Section" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Section_publicId_key" ON "Section"("publicId");

-- Add publicId to Subject
ALTER TABLE "Subject" ADD COLUMN "publicId" TEXT;
UPDATE "Subject" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Subject" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Subject_publicId_key" ON "Subject"("publicId");

-- Add publicId to Examination
ALTER TABLE "Examination" ADD COLUMN "publicId" TEXT;
UPDATE "Examination" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Examination" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Examination_publicId_key" ON "Examination"("publicId");

-- Add publicId to Attendance
ALTER TABLE "Attendance" ADD COLUMN "publicId" TEXT;
UPDATE "Attendance" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Attendance" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Attendance_publicId_key" ON "Attendance"("publicId");

-- Add publicId to Mark
ALTER TABLE "Mark" ADD COLUMN "publicId" TEXT;
UPDATE "Mark" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Mark" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Mark_publicId_key" ON "Mark"("publicId");

-- Add publicId to Result
ALTER TABLE "Result" ADD COLUMN "publicId" TEXT;
UPDATE "Result" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Result" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Result_publicId_key" ON "Result"("publicId");

-- Add publicId to Award
ALTER TABLE "Award" ADD COLUMN "publicId" TEXT;
UPDATE "Award" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Award" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Award_publicId_key" ON "Award"("publicId");

-- Add publicId to Certificate
ALTER TABLE "Certificate" ADD COLUMN "publicId" TEXT;
UPDATE "Certificate" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Certificate" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Certificate_publicId_key" ON "Certificate"("publicId");

-- Add publicId to Homework
ALTER TABLE "Homework" ADD COLUMN "publicId" TEXT;
UPDATE "Homework" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Homework" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Homework_publicId_key" ON "Homework"("publicId");

-- Add publicId to TimetableEntry
ALTER TABLE "TimetableEntry" ADD COLUMN "publicId" TEXT;
UPDATE "TimetableEntry" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "TimetableEntry" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "TimetableEntry_publicId_key" ON "TimetableEntry"("publicId");

-- Add publicId to Notification
ALTER TABLE "Notification" ADD COLUMN "publicId" TEXT;
UPDATE "Notification" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "Notification_publicId_key" ON "Notification"("publicId");

-- Add publicId to File
ALTER TABLE "File" ADD COLUMN "publicId" TEXT;
UPDATE "File" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "File" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "File_publicId_key" ON "File"("publicId");

-- Add publicId to BackupRecord
ALTER TABLE "BackupRecord" ADD COLUMN "publicId" TEXT;
UPDATE "BackupRecord" SET "publicId" = gen_random_uuid() WHERE "publicId" IS NULL;
ALTER TABLE "BackupRecord" ALTER COLUMN "publicId" SET NOT NULL;
CREATE UNIQUE INDEX "BackupRecord_publicId_key" ON "BackupRecord"("publicId");
