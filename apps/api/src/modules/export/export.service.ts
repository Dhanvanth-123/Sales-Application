import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { APP_NAME } from '@caliper/shared';
import { PartsService } from '../parts/parts.service';
import { PricingService } from '../pricing/pricing.service';
import { ReportsService } from '../reports/reports.service';
import { QualityService } from '../quality/quality.service';
import { AuditService } from '../audit/audit.service';

type Cell = string | number | null;
export interface Dataset {
  title: string;
  sheet: string;
  headers: string[];
  rows: Cell[][];
}
export type ExportQuery = Record<string, string | undefined>;

const BIG = 5000;

@Injectable()
export class ExportService {
  constructor(
    private readonly parts: PartsService,
    private readonly pricing: PricingService,
    private readonly reports: ReportsService,
    private readonly quality: QualityService,
    private readonly audit: AuditService,
  ) {}

  async dataset(view: string, q: ExportQuery): Promise<Dataset> {
    const page = { page: 1, pageSize: BIG };
    switch (view) {
      case 'parts': {
        const r = await this.parts.list({ ...page, q: q.q, customerId: q.customerId, status: q.status as never, sort: q.sort });
        return {
          title: 'Parts master',
          sheet: 'Parts',
          headers: ['Part no', 'Description', 'Customer', 'Status', 'Current price', 'Std cycle (min)'],
          rows: r.data.map((p) => [p.partNo, p.description, `${p.customerCode} ${p.customerName}`, p.status, p.currentPrice, p.stdCycleMin]),
        };
      }
      case 'pricing-master': {
        const r = await this.pricing.master({ q: q.q, customerId: q.customerId });
        return {
          title: 'Master price list',
          sheet: 'Master price',
          headers: ['Part no', 'Description', 'Customer', 'Status', 'Current price', 'Last change', 'Effective'],
          rows: r.map((m) => [m.partNo, m.description, m.customerCode, m.status, m.currentPrice, m.lastChangeType ?? '', isoDate(m.lastEffectiveDate)]),
        };
      }
      case 'pricing-changes': {
        const r = await this.pricing.changes({ ...page, q: q.q, customerId: q.customerId, from: q.from, to: q.to, type: q.type as never });
        return {
          title: 'Price-change history',
          sheet: 'Price changes',
          headers: ['Effective', 'Part no', 'Customer', 'Type', 'Old', 'New', 'Delta %', 'Reason', 'Approved by'],
          rows: r.data.map((c) => [isoDate(c.effectiveDate), c.partNo, c.customerCode, c.type, c.oldPrice, c.newPrice, round(c.deltaPct), c.reason, c.approvedBy ?? '']),
        };
      }
      case 'customer-wise': {
        const r = await this.reports.customerWise({ from: q.from, to: q.to });
        return {
          title: 'Customer-wise sales',
          sheet: 'Customer-wise',
          headers: ['Customer code', 'Customer', 'Orders', 'Qty', 'Value'],
          rows: r.map((c) => [c.customerCode, c.customerName, c.orders, c.qty, round(c.value)]),
        };
      }
      case 'month-wise': {
        const r = await this.reports.monthWise({ from: q.from, to: q.to, customerId: q.customerId });
        return {
          title: 'Month-wise sales',
          sheet: 'Month-wise',
          headers: ['Month', 'Orders', 'Qty', 'Value'],
          rows: r.map((m) => [m.month, m.orders, m.qty, round(m.value)]),
        };
      }
      case 'fopa': {
        const r = await this.quality.listFopa({ ...page, q: q.q, customerId: q.customerId, result: q.result as never });
        return {
          title: 'FOPA register',
          sheet: 'FOPA',
          headers: ['FOPA no', 'Part no', 'Customer', 'Date', 'Result', 'Characteristic', 'Approved by'],
          rows: r.data.map((f) => [f.fopaNo, f.partNo, f.customerCode, isoDate(f.date), f.result, f.characteristic ?? '', f.approvedBy ?? '']),
        };
      }
      case 'pdca': {
        const r = await this.quality.listPdca({ ...page, q: q.q, customerId: q.customerId, stage: q.stage as never, status: q.status as never });
        return {
          title: 'PDCA board',
          sheet: 'PDCA',
          headers: ['Title', 'Part no', 'Stage', 'Owner', 'Status', 'Target'],
          rows: r.data.map((p) => [p.title, p.partNo, p.stage, p.owner ?? '', p.status, isoDate(p.targetDate)]),
        };
      }
      case 'audit': {
        const r = await this.audit.query({ ...page, entity: q.entity, partNo: q.partNo, from: q.from, to: q.to });
        return {
          title: 'Audit trail',
          sheet: 'Audit',
          headers: ['Timestamp', 'Part no', 'Entity', 'Action', 'Field', 'Old', 'New', 'Reason', 'User'],
          rows: r.data.map((a) => [
            a.ts.toISOString(),
            a.partNo ?? '',
            a.entity,
            a.action,
            a.field ?? '',
            a.oldValue ?? '',
            a.newValue ?? '',
            a.reason ?? '',
            a.user?.name ?? '',
          ]),
        };
      }
      default:
        throw new BadRequestException({ code: 'UNKNOWN_VIEW', message: `Unknown export view: ${view}` });
    }
  }

  toCsv(d: Dataset): Buffer {
    const esc = (v: Cell) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [d.headers.map(esc).join(','), ...d.rows.map((r) => r.map(esc).join(','))];
    return Buffer.from('﻿' + lines.join('\r\n'), 'utf8');
  }

  toXlsx(d: Dataset): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([d.headers, ...d.rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, d.sheet.slice(0, 31));
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  toPdf(d: Dataset, generatedAt: string): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    const pageW = doc.page.width - 72;
    const startX = 36;

    // branded header
    doc.fillColor('#4338ca').fontSize(18).font('Helvetica-Bold').text(APP_NAME, startX, 36);
    doc.fillColor('#0f172a').fontSize(13).text(d.title, startX, 60);
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`Generated ${generatedAt}`, startX, 78);

    const colW = pageW / d.headers.length;
    let y = 104;

    const drawRow = (cells: Cell[], opts: { header?: boolean }) => {
      doc.font(opts.header ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      doc.fillColor(opts.header ? '#334155' : '#0f172a');
      cells.forEach((c, i) => {
        const text = c === null || c === undefined ? '' : String(c);
        doc.text(text, startX + i * colW + 2, y, { width: colW - 4, height: 12, ellipsis: true, lineBreak: false });
      });
      y += opts.header ? 16 : 13;
      doc.moveTo(startX, y - 3).lineTo(startX + pageW, y - 3).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    };

    drawRow(d.headers, { header: true });
    for (const row of d.rows) {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 40;
        drawRow(d.headers, { header: true });
      }
      drawRow(row, {});
    }

    doc.fillColor('#94a3b8').fontSize(8).text(`${d.rows.length} rows · ${APP_NAME}`, startX, doc.page.height - 36);
    doc.end();
    return done;
  }
}

function isoDate(s: string | null): string {
  return s ? s.slice(0, 10) : '';
}
function round(n: number | null): number | null {
  return n === null ? null : Math.round(n * 100) / 100;
}
