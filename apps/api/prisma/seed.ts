/**
 * Dev/UAT seed (plan §13 Phase 0 — "DB seeded"). Idempotent: wipes and rebuilds
 * the dataset on every run. Refuses to run against NODE_ENV=production.
 *
 * Default password for every seeded user: "Caliper@123"
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const DEFAULT_PASSWORD = 'Caliper@123';

const d = (iso: string) => new Date(iso + 'T00:00:00.000Z');
const dec = (n: number) => new Prisma.Decimal(n);

async function wipe() {
  // audit_log is append-only (BEFORE UPDATE/DELETE trigger) — TRUNCATE bypasses the
  // row trigger and resets it for dev seeding.
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "audit_log" RESTART IDENTITY CASCADE');
  // delete children before parents (FK order)
  await prisma.attachment.deleteMany();
  await prisma.priceChange.deleteMany();
  await prisma.cycleTimeRevision.deleteMany();
  await prisma.qualityRecord.deleteMany();
  await prisma.fopaRecord.deleteMany();
  await prisma.pdcaItem.deleteMany();
  await prisma.faiRecord.deleteMany();
  await prisma.pilotLot.deleteMany();
  await prisma.productionLot.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.labourEntry.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.pvcIndex.deleteMany();
  await prisma.part.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run destructive seed with NODE_ENV=production');
  }

  console.log('🌱  Seeding CALIPER…');
  await wipe();

  const passwordHash = await hash(DEFAULT_PASSWORD, ARGON2_OPTS);

  // ── users (one per role) ──
  const users = await Promise.all(
    (
      [
        ['admin@caliper.local', 'Asha Admin', 'ADMIN'],
        ['sales@caliper.local', 'Sanjay Sales', 'SALES'],
        ['costing@caliper.local', 'Kiran Costing', 'COSTING'],
        ['quality@caliper.local', 'Qadir Quality', 'QUALITY'],
        ['viewer@caliper.local', 'Vidya Viewer', 'VIEWER'],
      ] as const
    ).map(([email, name, role]) =>
      prisma.user.create({ data: { email, name, role, passwordHash, isActive: true } }),
    ),
  );
  const admin = users[0];
  const quality = users[3];
  console.log(`   • ${users.length} users`);

  // ── customers ──
  const acme = await prisma.customer.create({
    data: { code: 'ACME', name: 'ACME Engineering Pvt Ltd', gstin: '27AABCA1234A1Z5', contactName: 'R. Mehta', email: 'purchase@acme.example', phone: '+91 22 4000 1000' },
  });
  const bal = await prisma.customer.create({
    data: { code: 'BAL', name: 'Bharat Auto Ltd', gstin: '29AABCB5678B1Z2', contactName: 'P. Iyer', email: 'scm@bharatauto.example', phone: '+91 80 5000 2000' },
  });
  const pdx = await prisma.customer.create({
    data: { code: 'PDX', name: 'Precision Dynamics', gstin: '33AABCP9012C1Z8', contactName: 'S. Nair', email: 'buyer@pdx.example', phone: '+91 44 6000 3000' },
  });
  const customers = [acme, bal, pdx];
  console.log(`   • ${customers.length} customers`);

  // ── parts + full history ──
  type PartSpec = {
    partNo: string;
    description: string;
    customer: { id: string };
    material: string;
    drawingNo: string;
    status: 'ACTIVE' | 'INACTIVE' | 'NPD';
    price: number;
    cycleMin: number;
  };

  const specs: PartSpec[] = [
    { partNo: 'CLP-1001', description: 'Hydraulic Manifold Block', customer: acme, material: 'EN8', drawingNo: 'ACM-MB-001', status: 'ACTIVE', price: 1250.0, cycleMin: 12.5 },
    { partNo: 'CLP-1002', description: 'Spindle Housing', customer: acme, material: 'Aluminium 6061', drawingNo: 'ACM-SH-014', status: 'ACTIVE', price: 880.0, cycleMin: 8.0 },
    { partNo: 'CLP-2001', description: 'Gearbox End Cover', customer: bal, material: 'Cast Iron', drawingNo: 'BAL-EC-220', status: 'ACTIVE', price: 540.5, cycleMin: 6.25 },
    { partNo: 'CLP-2002', description: 'Steering Knuckle Bracket', customer: bal, material: 'SG Iron', drawingNo: 'BAL-SK-118', status: 'NPD', price: 1620.0, cycleMin: 18.0 },
    { partNo: 'CLP-3001', description: 'Precision Bushing', customer: pdx, material: 'Phosphor Bronze', drawingNo: 'PDX-BU-007', status: 'ACTIVE', price: 95.0, cycleMin: 2.5 },
    { partNo: 'CLP-3002', description: 'Servo Mount Plate', customer: pdx, material: 'SS304', drawingNo: 'PDX-SM-031', status: 'INACTIVE', price: 410.0, cycleMin: 5.5 },
  ];

  for (const [i, s] of specs.entries()) {
    const part = await prisma.part.create({
      data: {
        partNo: s.partNo,
        description: s.description,
        customerId: s.customer.id,
        material: s.material,
        drawingNo: s.drawingNo,
        status: s.status,
        uom: 'NOS',
        currentPrice: dec(s.price),
        stdCycleMin: dec(s.cycleMin),
      },
    });

    // labour
    await prisma.labourEntry.createMany({
      data: [
        { partId: part.id, operation: 'CNC Turning', grade: 'Operator-A', ratePerHr: dec(180), stdTimeMin: dec(s.cycleMin * 0.6) },
        { partId: part.id, operation: 'Inspection', grade: 'QC-B', ratePerHr: dec(150), stdTimeMin: dec(2) },
      ],
    });

    // operations
    await prisma.operation.createMany({
      data: [
        { partId: part.id, seq: 10, operation: 'Facing & Centering', machine: 'CNC-LT-01', setupMin: dec(15), cycleMin: dec(s.cycleMin * 0.4), tooling: 'CNMG 120408' },
        { partId: part.id, seq: 20, operation: 'Rough + Finish Turn', machine: 'CNC-LT-02', setupMin: dec(20), cycleMin: dec(s.cycleMin * 0.6), tooling: 'DNMG 150608' },
        { partId: part.id, seq: 30, operation: 'Deburr & Wash', machine: 'WASH-01', setupMin: dec(5), cycleMin: dec(1.5), tooling: null },
      ],
    });

    // sales across recent months
    const months = ['2025-09-08', '2025-10-12', '2025-11-05', '2025-12-03'];
    await prisma.sale.createMany({
      data: months.map((m, k) => ({
        partId: part.id,
        customerId: s.customer.id,
        date: d(m),
        soNo: `SO-${2025}-${1000 + i * 10 + k}`,
        qty: 50 + k * 25,
        unitPrice: dec(s.price),
      })),
    });

    // quotation
    await prisma.quotation.create({
      data: {
        partId: part.id,
        customerId: s.customer.id,
        quoteNo: `QT-${2025}-${200 + i}`,
        date: d('2025-08-15'),
        qty: 100,
        quotedPrice: dec(s.price * 1.05),
        status: i % 3 === 0 ? 'WON' : i % 3 === 1 ? 'PENDING' : 'LOST',
        validUntil: d('2025-12-31'),
      },
    });

    // price history: NEW then a REVISION (and a PVC on the first part)
    await prisma.priceChange.create({
      data: {
        partId: part.id,
        effectiveDate: d('2025-01-01'),
        oldPrice: null,
        newPrice: dec(s.price * 0.9),
        type: 'NEW',
        reason: 'Initial price on part introduction',
        approvedById: admin.id,
      },
    });
    await prisma.priceChange.create({
      data: {
        partId: part.id,
        effectiveDate: d('2025-07-01'),
        oldPrice: dec(s.price * 0.9),
        newPrice: dec(s.price),
        type: i === 0 ? 'PVC' : 'REVISION',
        reason: i === 0 ? 'Steel index PVC H1-2025' : 'Annual price revision 2025',
        approvedById: admin.id,
        pvcBasis: i === 0 ? ({ baseIndex: 100, currentIndex: 111.1, materialWeight: 0.65 } as Prisma.InputJsonValue) : undefined,
      },
    });

    // cycle-time revisions
    await prisma.cycleTimeRevision.create({
      data: { partId: part.id, rev: 1, date: d('2025-01-05'), cycleMin: dec(s.cycleMin * 1.1), reason: 'Baseline from pilot lot', approvedById: admin.id },
    });
    await prisma.cycleTimeRevision.create({
      data: { partId: part.id, rev: 2, date: d('2025-06-20'), cycleMin: dec(s.cycleMin), reason: 'Tooling optimisation', approvedById: admin.id },
    });

    // inspection & lots
    await prisma.faiRecord.create({
      data: { partId: part.id, faiNo: `FAI-${part.partNo}`, date: d('2025-01-10'), qtyInspected: 5, result: i === 3 ? 'FAIL' : 'PASS', inspector: 'Qadir Quality', remarks: i === 3 ? 'Dim 12.0 +/-0.02 OOT' : 'All characteristics in spec' },
    });
    await prisma.pilotLot.create({
      data: { partId: part.id, lotNo: `PL-${part.partNo}`, date: d('2025-02-01'), qty: 30, accepted: 28, rejected: 2, remarks: 'Minor burr on 2 pcs' },
    });
    await prisma.productionLot.createMany({
      data: [
        { partId: part.id, lotNo: `PRD-${part.partNo}-A`, date: d('2025-09-15'), qty: 500, accepted: 496, rejected: 4 },
        { partId: part.id, lotNo: `PRD-${part.partNo}-B`, date: d('2025-11-15'), qty: 750, accepted: 747, rejected: 3 },
      ],
    });

    // quality records
    await prisma.qualityRecord.create({
      data: { partId: part.id, date: d('2025-10-20'), type: 'INSPECTION', result: 'OK', defect: null, ppm: dec(800), remarks: 'Routine patrol inspection' },
    });
    if (i % 2 === 0) {
      await prisma.qualityRecord.create({
        data: { partId: part.id, date: d('2025-11-22'), type: 'COMPLAINT', result: 'NOK', defect: 'Surface finish', ppm: dec(1500), remarks: 'Customer complaint — CAPA raised' },
      });
    }

    // FOPA
    await prisma.fopaRecord.create({
      data: { partId: part.id, fopaNo: `FOPA-${part.partNo}`, date: d('2025-02-10'), result: i === 3 ? 'CONDITIONAL' : 'APPROVED', characteristic: 'Critical bore Ø dimension', remarks: i === 3 ? 'Approved subject to 100% inspection' : 'First-off approved', approvedById: quality.id },
    });

    // PDCA
    await prisma.pdcaItem.createMany({
      data: [
        { partId: part.id, title: 'Reduce cycle time 10%', stage: 'DO', issue: 'High cycle on OP20', action: 'Trial higher-feed insert', owner: 'Kiran Costing', status: 'IN_PROGRESS', targetDate: d('2026-01-31') },
        { partId: part.id, title: 'Eliminate deburr rework', stage: 'PLAN', issue: 'Burrs at cross-hole', action: 'Add chamfer in OP10', owner: 'Qadir Quality', status: 'OPEN', targetDate: d('2026-02-28') },
      ],
    });
  }
  console.log(`   • ${specs.length} parts with full history`);

  // ── one PVC index point (optional feed) ──
  await prisma.pvcIndex.create({
    data: { name: 'STEEL', date: d('2025-07-01'), value: dec(111.1), source: 'seed' },
  });

  console.log('✅  Seed complete. Login with admin@caliper.local / Caliper@123');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
