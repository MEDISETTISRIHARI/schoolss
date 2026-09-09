-- Drop existing unique constraint on schoolId
DROP INDEX IF EXISTS "SchoolSetting_schoolId_key";

-- Create new unique constraint on schoolId + key
CREATE UNIQUE INDEX "SchoolSetting_schoolId_key_key" ON "SchoolSetting"("schoolId", "key");
