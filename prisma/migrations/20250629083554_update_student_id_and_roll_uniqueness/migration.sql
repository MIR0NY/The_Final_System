/*
  Warnings:

  - A unique constraint covering the columns `[class,section,roll]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "students_roll_key";

-- CreateIndex
CREATE UNIQUE INDEX "students_class_section_roll_key" ON "students"("class", "section", "roll");
