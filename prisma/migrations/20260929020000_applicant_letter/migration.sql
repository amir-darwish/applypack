-- CreateTable
CREATE TABLE "applicant_letter" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "sourceFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "original" BYTEA NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applicant_letter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applicant_letter_applicantId_idx" ON "applicant_letter"("applicantId");

-- AddForeignKey
ALTER TABLE "applicant_letter" ADD CONSTRAINT "applicant_letter_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

