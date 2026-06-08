-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SALES', 'COSTING', 'QUALITY', 'VIEWER');

-- CreateEnum
CREATE TYPE "PartStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'NPD');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('WON', 'LOST', 'PENDING');

-- CreateEnum
CREATE TYPE "FaiResult" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "PriceChangeType" AS ENUM ('NEW', 'REVISION', 'PVC');

-- CreateEnum
CREATE TYPE "QualityRecordType" AS ENUM ('INSPECTION', 'COMPLAINT', 'FAI', 'AUDIT');

-- CreateEnum
CREATE TYPE "FopaResult" AS ENUM ('APPROVED', 'REJECTED', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "PdcaStage" AS ENUM ('PLAN', 'DO', 'CHECK', 'ACT');

-- CreateEnum
CREATE TYPE "PdcaStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "passwordHash" TEXT,
    "externalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gstin" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part" (
    "id" TEXT NOT NULL,
    "partNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "material" TEXT,
    "drawingNo" TEXT,
    "status" "PartStatus" NOT NULL DEFAULT 'ACTIVE',
    "uom" TEXT NOT NULL DEFAULT 'NOS',
    "currentPrice" DECIMAL(12,2),
    "stdCycleMin" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labour_entry" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "grade" TEXT,
    "ratePerHr" DECIMAL(10,2) NOT NULL,
    "stdTimeMin" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "labour_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "operation" TEXT NOT NULL,
    "machine" TEXT,
    "setupMin" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "cycleMin" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "tooling" TEXT,

    CONSTRAINT "operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "soNo" TEXT,
    "qty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "qty" INTEGER NOT NULL,
    "quotedPrice" DECIMAL(12,2) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'PENDING',
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fai_record" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "faiNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "qtyInspected" INTEGER NOT NULL,
    "result" "FaiResult" NOT NULL,
    "inspector" TEXT,
    "remarks" TEXT,

    CONSTRAINT "fai_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_lot" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "qty" INTEGER NOT NULL,
    "accepted" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,

    CONSTRAINT "pilot_lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_lot" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "qty" INTEGER NOT NULL,
    "accepted" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "production_lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_time_revision" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cycleMin" DECIMAL(8,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedById" TEXT,

    CONSTRAINT "cycle_time_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_change" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "oldPrice" DECIMAL(12,2),
    "newPrice" DECIMAL(12,2) NOT NULL,
    "type" "PriceChangeType" NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedById" TEXT,
    "pvcIndexId" TEXT,
    "pvcBasis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_record" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "QualityRecordType" NOT NULL,
    "result" TEXT,
    "defect" TEXT,
    "ppm" DECIMAL(12,2),
    "remarks" TEXT,

    CONSTRAINT "quality_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fopa_record" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "fopaNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "result" "FopaResult" NOT NULL,
    "characteristic" TEXT,
    "remarks" TEXT,
    "approvedById" TEXT,

    CONSTRAINT "fopa_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdca_item" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" "PdcaStage" NOT NULL DEFAULT 'PLAN',
    "issue" TEXT,
    "action" TEXT,
    "owner" TEXT,
    "status" "PdcaStatus" NOT NULL DEFAULT 'OPEN',
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdca_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "partNo" TEXT,
    "action" "AuditAction" NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvc_index" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "source" TEXT,

    CONSTRAINT "pvc_index_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_externalId_key" ON "user"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_code_key" ON "customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "part_partNo_key" ON "part"("partNo");

-- CreateIndex
CREATE INDEX "part_customerId_idx" ON "part"("customerId");

-- CreateIndex
CREATE INDEX "part_status_idx" ON "part"("status");

-- CreateIndex
CREATE INDEX "labour_entry_partId_idx" ON "labour_entry"("partId");

-- CreateIndex
CREATE INDEX "operation_partId_idx" ON "operation"("partId");

-- CreateIndex
CREATE INDEX "sale_partId_idx" ON "sale"("partId");

-- CreateIndex
CREATE INDEX "sale_customerId_idx" ON "sale"("customerId");

-- CreateIndex
CREATE INDEX "sale_date_idx" ON "sale"("date");

-- CreateIndex
CREATE INDEX "quotation_partId_idx" ON "quotation"("partId");

-- CreateIndex
CREATE INDEX "quotation_customerId_idx" ON "quotation"("customerId");

-- CreateIndex
CREATE INDEX "fai_record_partId_idx" ON "fai_record"("partId");

-- CreateIndex
CREATE INDEX "pilot_lot_partId_idx" ON "pilot_lot"("partId");

-- CreateIndex
CREATE INDEX "production_lot_partId_idx" ON "production_lot"("partId");

-- CreateIndex
CREATE INDEX "cycle_time_revision_partId_idx" ON "cycle_time_revision"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_time_revision_partId_rev_key" ON "cycle_time_revision"("partId", "rev");

-- CreateIndex
CREATE INDEX "price_change_partId_idx" ON "price_change"("partId");

-- CreateIndex
CREATE INDEX "price_change_effectiveDate_idx" ON "price_change"("effectiveDate");

-- CreateIndex
CREATE INDEX "quality_record_partId_idx" ON "quality_record"("partId");

-- CreateIndex
CREATE INDEX "fopa_record_partId_idx" ON "fopa_record"("partId");

-- CreateIndex
CREATE INDEX "pdca_item_partId_idx" ON "pdca_item"("partId");

-- CreateIndex
CREATE INDEX "attachment_entityType_entityId_idx" ON "attachment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_entity_entityId_idx" ON "audit_log"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_partNo_idx" ON "audit_log"("partNo");

-- CreateIndex
CREATE INDEX "audit_log_ts_idx" ON "audit_log"("ts");

-- CreateIndex
CREATE INDEX "pvc_index_name_date_idx" ON "pvc_index"("name", "date");

-- AddForeignKey
ALTER TABLE "part" ADD CONSTRAINT "part_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_entry" ADD CONSTRAINT "labour_entry_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation" ADD CONSTRAINT "operation_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fai_record" ADD CONSTRAINT "fai_record_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_lot" ADD CONSTRAINT "pilot_lot_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_lot" ADD CONSTRAINT "production_lot_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_time_revision" ADD CONSTRAINT "cycle_time_revision_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_time_revision" ADD CONSTRAINT "cycle_time_revision_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_change" ADD CONSTRAINT "price_change_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_change" ADD CONSTRAINT "price_change_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_change" ADD CONSTRAINT "price_change_pvcIndexId_fkey" FOREIGN KEY ("pvcIndexId") REFERENCES "pvc_index"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_record" ADD CONSTRAINT "quality_record_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fopa_record" ADD CONSTRAINT "fopa_record_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fopa_record" ADD CONSTRAINT "fopa_record_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdca_item" ADD CONSTRAINT "pdca_item_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
