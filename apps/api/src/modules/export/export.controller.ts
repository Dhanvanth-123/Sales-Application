import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';

const MIME: Record<string, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

@Controller('export')
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  /** Export any tabular view to CSV / XLSX / PDF (R7). e.g. /export/customer-wise?format=xlsx */
  @Get(':view')
  async download(
    @Param('view') view: string,
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ): Promise<void> {
    const format = (query.format ?? 'csv').toLowerCase();
    if (!MIME[format]) {
      throw new BadRequestException({ code: 'BAD_FORMAT', message: 'format must be csv, xlsx or pdf' });
    }

    const dataset = await this.exporter.dataset(view, query);
    const filename = `${view}-${stamp().slice(0, 10)}.${format}`;

    let body: Buffer;
    if (format === 'csv') body = this.exporter.toCsv(dataset);
    else if (format === 'xlsx') body = this.exporter.toXlsx(dataset);
    else body = await this.exporter.toPdf(dataset, stamp().replace('T', ' ').slice(0, 19));

    res.set({
      'Content-Type': MIME[format],
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(body);
  }
}

function stamp(): string {
  return new Date().toISOString();
}
