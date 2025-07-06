-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "class" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "roll" INTEGER NOT NULL,
    "address" TEXT,
    "guardian" TEXT,
    "contact" TEXT,
    "tuitionFee" REAL NOT NULL,
    "vehicleNo" TEXT,
    "vehicleFee" REAL,
    "stationName" TEXT,
    "dateOfBirth" TEXT,
    "bloodGroup" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "admissionMonth" TEXT
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNo" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "students_roll_key" ON "students"("roll");
