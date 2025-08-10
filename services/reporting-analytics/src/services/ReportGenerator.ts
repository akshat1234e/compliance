/**
 * Report Generator Service
 * Automated report generation with multiple output formats
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import handlebars from 'handlebars';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import {
  Report,
  ReportTemplate,
  ReportRequest,
  ReportStatus,
  ReportFormat,
  ReportData,
  GenerationResult,
} from '@types/report';

export class ReportGenerator extends EventEmitter {
  private isInitialized = false;
  private templates: Map<string, ReportTemplate> = new Map();
  private activeJobs: Map<string, Report> = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize the report generator
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Report generator already initialized');
      return;
    }

    try {
      logger.info('Initializing Report Generator...');

      // Create necessary directories
      await this.createDirectories();

      // Load report templates
      await this.loadReportTemplates();

      this.isInitialized = true;
      logger.info('Report Generator initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Report Generator', error);
      throw error;
    }
  }

  /**
   * Generate a report
   */
  public async generateReport(request: ReportRequest): Promise<GenerationResult> {
    const reportId = this.generateReportId();
    const startTime = Date.now();

    try {
      logger.info('Starting report generation', {
        reportId,
        templateId: request.templateId,
        format: request.format,
        userId: request.userId,
      });

      // Create report instance
      const report: Report = {
        id: reportId,
        templateId: request.templateId,
        name: request.name || `Report ${reportId}`,
        description: request.description,
        format: request.format,
        status: ReportStatus.GENERATING,
        parameters: request.parameters || {},
        filters: request.filters || {},
        createdAt: new Date(),
        createdBy: request.userId,
        organizationId: request.organizationId,
      };

      this.activeJobs.set(reportId, report);
      this.emit('reportStarted', report);

      // Get template
      const template = this.templates.get(request.templateId);
      if (!template) {
        throw new Error(`Report template not found: ${request.templateId}`);
      }

      // Fetch data
      const data = await this.fetchReportData(template, request.parameters, request.filters);

      // Generate report based on format
      let filePath: string;
      switch (request.format) {
        case ReportFormat.PDF:
          filePath = await this.generatePDFReport(report, template, data);
          break;
        case ReportFormat.EXCEL:
          filePath = await this.generateExcelReport(report, template, data);
          break;
        case ReportFormat.CSV:
          filePath = await this.generateCSVReport(report, template, data);
          break;
        case ReportFormat.JSON:
          filePath = await this.generateJSONReport(report, template, data);
          break;
        default:
          throw new Error(`Unsupported report format: ${request.format}`);
      }

      // Update report status
      report.status = ReportStatus.COMPLETED;
      report.completedAt = new Date();
      report.filePath = filePath;
      report.fileSize = (await fs.stat(filePath)).size;
      report.generationTime = Date.now() - startTime;

      const result: GenerationResult = {
        reportId,
        status: ReportStatus.COMPLETED,
        filePath,
        fileSize: report.fileSize,
        generationTime: report.generationTime,
        downloadUrl: this.getDownloadUrl(reportId),
      };

      logger.info('Report generation completed', {
        reportId,
        generationTime: report.generationTime,
        fileSize: report.fileSize,
      });

      this.emit('reportCompleted', report);
      return result;
    } catch (error) {
      const report = this.activeJobs.get(reportId);
      if (report) {
        report.status = ReportStatus.FAILED;
        report.completedAt = new Date();
        report.error = (error as Error).message;
        report.generationTime = Date.now() - startTime;
      }

      logger.error('Report generation failed', {
        reportId,
        error: (error as Error).message,
      });

      this.emit('reportFailed', report, error);
      throw error;
    }
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(
    report: Report,
    template: ReportTemplate,
    data: ReportData
  ): Promise<string> {
    const filePath = path.join(config.reports.outputPath, `${report.id}.pdf`);
    const doc = new PDFDocument();

    return new Promise((resolve, reject) => {
      const stream = doc.pipe(require('fs').createWriteStream(filePath));

      // Add header
      doc.fontSize(20).text(report.name, 50, 50);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);
      doc.moveDown();

      // Add content based on template
      if (template.sections) {
        let yPosition = 120;
        
        for (const section of template.sections) {
          // Section title
          doc.fontSize(16).text(section.title, 50, yPosition);
          yPosition += 30;

          // Section content
          if (section.type === 'table' && data.tables?.[section.dataKey]) {
            yPosition = this.addTableToPDF(doc, data.tables[section.dataKey], yPosition);
          } else if (section.type === 'chart' && data.charts?.[section.dataKey]) {
            // Chart would be rendered as image and added here
            doc.fontSize(12).text(`[Chart: ${section.title}]`, 50, yPosition);
            yPosition += 20;
          } else if (section.type === 'text' && data.text?.[section.dataKey]) {
            doc.fontSize(12).text(data.text[section.dataKey], 50, yPosition);
            yPosition += 20;
          }

          yPosition += 20;
        }
      }

      // Add footer
      const pageHeight = doc.page.height;
      doc.fontSize(10).text(
        `Page 1 of 1 | Generated by Compliance Platform`,
        50,
        pageHeight - 50
      );

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(
    report: Report,
    template: ReportTemplate,
    data: ReportData
  ): Promise<string> {
    const filePath = path.join(config.reports.outputPath, `${report.id}.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // Add metadata
    workbook.creator = 'Compliance Platform';
    workbook.created = new Date();
    workbook.title = report.name;

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Report Name', report.name]);
    summarySheet.addRow(['Generated On', new Date().toISOString()]);
    summarySheet.addRow(['Generated By', report.createdBy]);
    summarySheet.addRow(['Organization', report.organizationId]);

    // Add data sheets based on template
    if (template.sections) {
      for (const section of template.sections) {
        if (section.type === 'table' && data.tables?.[section.dataKey]) {
          const sheet = workbook.addWorksheet(section.title);
          const tableData = data.tables[section.dataKey];
          
          if (tableData.length > 0) {
            // Add headers
            const headers = Object.keys(tableData[0]);
            sheet.addRow(headers);
            
            // Add data rows
            tableData.forEach(row => {
              sheet.addRow(headers.map(header => row[header]));
            });

            // Style headers
            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
          }
        }
      }
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(
    report: Report,
    template: ReportTemplate,
    data: ReportData
  ): Promise<string> {
    const filePath = path.join(config.reports.outputPath, `${report.id}.csv`);

    // For CSV, we'll use the first table in the data
    const firstTableKey = Object.keys(data.tables || {})[0];
    if (!firstTableKey || !data.tables?.[firstTableKey]) {
      throw new Error('No table data available for CSV export');
    }

    const tableData = data.tables[firstTableKey];
    if (tableData.length === 0) {
      throw new Error('Table data is empty');
    }

    const headers = Object.keys(tableData[0]);
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers.map(header => ({ id: header, title: header }))
    });

    await csvWriter.writeRecords(tableData);
    return filePath;
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(
    report: Report,
    template: ReportTemplate,
    data: ReportData
  ): Promise<string> {
    const filePath = path.join(config.reports.outputPath, `${report.id}.json`);

    const jsonReport = {
      metadata: {
        reportId: report.id,
        name: report.name,
        description: report.description,
        generatedAt: new Date().toISOString(),
        generatedBy: report.createdBy,
        organizationId: report.organizationId,
        template: template.name,
      },
      data,
    };

    await fs.writeFile(filePath, JSON.stringify(jsonReport, null, 2));
    return filePath;
  }

  /**
   * Fetch report data based on template and parameters
   */
  private async fetchReportData(
    template: ReportTemplate,
    parameters: Record<string, any>,
    filters: Record<string, any>
  ): Promise<ReportData> {
    // This would typically fetch data from databases, APIs, etc.
    // For now, return mock data
    return {
      tables: {
        compliance_metrics: [
          { metric: 'Compliance Score', value: 95, target: 90, status: 'Good' },
          { metric: 'Open Issues', value: 5, target: 0, status: 'Attention' },
          { metric: 'Resolved Issues', value: 45, target: 40, status: 'Good' },
        ],
        recent_activities: [
          { date: '2024-01-15', activity: 'Policy Update', status: 'Completed' },
          { date: '2024-01-14', activity: 'Audit Review', status: 'In Progress' },
          { date: '2024-01-13', activity: 'Training Session', status: 'Completed' },
        ],
      },
      charts: {
        compliance_trend: {
          type: 'line',
          data: [85, 87, 90, 92, 95],
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        },
      },
      text: {
        summary: 'Overall compliance performance is strong with a score of 95%.',
        recommendations: 'Focus on resolving the 5 open issues to achieve perfect compliance.',
      },
    };
  }

  /**
   * Add table to PDF document
   */
  private addTableToPDF(doc: any, tableData: any[], yPosition: number): number {
    if (tableData.length === 0) return yPosition;

    const headers = Object.keys(tableData[0]);
    const columnWidth = 100;
    let currentY = yPosition;

    // Add headers
    headers.forEach((header, index) => {
      doc.fontSize(10).text(header, 50 + (index * columnWidth), currentY);
    });
    currentY += 20;

    // Add data rows
    tableData.forEach(row => {
      headers.forEach((header, index) => {
        doc.fontSize(9).text(
          String(row[header] || ''),
          50 + (index * columnWidth),
          currentY
        );
      });
      currentY += 15;
    });

    return currentY + 10;
  }

  /**
   * Create necessary directories
   */
  private async createDirectories(): Promise<void> {
    const directories = [
      config.reports.outputPath,
      config.reports.tempPath,
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  /**
   * Load report templates
   */
  private async loadReportTemplates(): Promise<void> {
    // Load templates from database or file system
    // For now, create some default templates
    const defaultTemplates: ReportTemplate[] = [
      {
        id: 'compliance_summary',
        name: 'Compliance Summary Report',
        description: 'Overall compliance status and metrics',
        category: 'compliance',
        sections: [
          {
            id: 'metrics',
            title: 'Compliance Metrics',
            type: 'table',
            dataKey: 'compliance_metrics',
          },
          {
            id: 'trend',
            title: 'Compliance Trend',
            type: 'chart',
            dataKey: 'compliance_trend',
          },
          {
            id: 'activities',
            title: 'Recent Activities',
            type: 'table',
            dataKey: 'recent_activities',
          },
        ],
        parameters: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info('Report templates loaded', { count: this.templates.size });
  }

  /**
   * Generate report ID
   */
  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get download URL for report
   */
  private getDownloadUrl(reportId: string): string {
    return `/api/v1/reports/${reportId}/download`;
  }

  /**
   * Get report by ID
   */
  public getReport(reportId: string): Report | undefined {
    return this.activeJobs.get(reportId);
  }

  /**
   * Get all active reports
   */
  public getActiveReports(): Report[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Shutdown the report generator
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Report Generator...');
    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Report Generator shutdown completed');
  }
}

export default ReportGenerator;
