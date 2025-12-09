-- CreateTable
CREATE TABLE "SavedRepository" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "repo" TEXT,
    "projectPath" TEXT,
    "host" TEXT,
    "branch" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedRepository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedRepository_userId_type_idx" ON "SavedRepository"("userId", "type");

-- AddForeignKey
ALTER TABLE "SavedRepository" ADD CONSTRAINT "SavedRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
