-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "what_happened" TEXT NOT NULL,
    "root_cause" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "fix" TEXT NOT NULL,
    "lessons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prevention" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cost_estimate" INTEGER,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incidents_slug_key" ON "incidents"("slug");

-- CreateIndex
CREATE INDEX "incidents_created_at_idx" ON "incidents"("created_at");

-- CreateIndex
CREATE INDEX "incidents_upvotes_idx" ON "incidents"("upvotes");
