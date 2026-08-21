-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('WEBSITE', 'X');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "BidKind" AS ENUM ('BID', 'TAKEOVER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "identityType" "IdentityType" NOT NULL,
    "identityKey" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "status" "ListingStatus" NOT NULL DEFAULT 'PENDING',
    "rankedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidCents" INTEGER NOT NULL,
    "kind" "BidKind" NOT NULL DEFAULT 'BID',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "sessionId" TEXT,
    "paymentId" TEXT,
    "customerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Takeover" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "frozenIds" TEXT[],

    CONSTRAINT "Takeover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClickEvent" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,

    CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "sessionId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("sessionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Listing_identityKey_key" ON "Listing"("identityKey");

-- CreateIndex
CREATE INDEX "Listing_status_amountCents_rankedAt_idx" ON "Listing"("status", "amountCents" DESC, "rankedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_sessionId_key" ON "Bid"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_paymentId_key" ON "Bid"("paymentId");

-- CreateIndex
CREATE INDEX "Bid_listingId_createdAt_idx" ON "Bid"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "Bid_status_idx" ON "Bid"("status");

-- CreateIndex
CREATE INDEX "Takeover_endsAt_idx" ON "Takeover"("endsAt");

-- CreateIndex
CREATE INDEX "ClickEvent_listingId_createdAt_idx" ON "ClickEvent"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "Presence_lastSeenAt_idx" ON "Presence"("lastSeenAt");

-- CreateIndex
CREATE INDEX "Presence_firstSeenAt_idx" ON "Presence"("firstSeenAt");

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Takeover" ADD CONSTRAINT "Takeover_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClickEvent" ADD CONSTRAINT "ClickEvent_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
