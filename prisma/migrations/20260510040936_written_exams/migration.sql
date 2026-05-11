-- CreateTable
CREATE TABLE "WrittenExam" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WrittenExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrittenExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,

    CONSTRAINT "WrittenExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrittenExamSubmission" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "WrittenExamSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrittenExamCompletion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WrittenExamCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WrittenExam_courseId_idx" ON "WrittenExam"("courseId");

-- CreateIndex
CREATE INDEX "WrittenExamQuestion_examId_idx" ON "WrittenExamQuestion"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "WrittenExamQuestion_examId_orderIndex_key" ON "WrittenExamQuestion"("examId", "orderIndex");

-- CreateIndex
CREATE INDEX "WrittenExamSubmission_examId_idx" ON "WrittenExamSubmission"("examId");

-- CreateIndex
CREATE INDEX "WrittenExamSubmission_userId_idx" ON "WrittenExamSubmission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WrittenExamSubmission_examId_userId_key" ON "WrittenExamSubmission"("examId", "userId");

-- CreateIndex
CREATE INDEX "WrittenExamCompletion_userId_idx" ON "WrittenExamCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WrittenExamCompletion_examId_userId_key" ON "WrittenExamCompletion"("examId", "userId");

-- AddForeignKey
ALTER TABLE "WrittenExam" ADD CONSTRAINT "WrittenExam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrittenExamQuestion" ADD CONSTRAINT "WrittenExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "WrittenExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrittenExamSubmission" ADD CONSTRAINT "WrittenExamSubmission_examId_fkey" FOREIGN KEY ("examId") REFERENCES "WrittenExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrittenExamSubmission" ADD CONSTRAINT "WrittenExamSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrittenExamCompletion" ADD CONSTRAINT "WrittenExamCompletion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "WrittenExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrittenExamCompletion" ADD CONSTRAINT "WrittenExamCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
