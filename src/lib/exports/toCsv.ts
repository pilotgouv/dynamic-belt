
import { ReportExportMeta, ReportExportTableRow } from "./reportExportTypes";

export function toCsv(
    data: ReportExportTableRow[],
    meta?: ReportExportMeta
): string {
    if (!data || data.length === 0) {
        return '';
    }

    // 1. Generate Metadata Block
    let csvContent = '';
    if (meta) {
        csvContent += `# PILOT Report Export\n`;
        csvContent += `# Organization: ${meta.organizationName}\n`;
        csvContent += `# Generated: ${meta.generatedAt}\n`;
        csvContent += `# Period: ${meta.period.start} to ${meta.period.end} (${meta.granularity})\n`;
        csvContent += `# Data Confidence: ${meta.confidence} (${meta.confidenceReasons.join(', ')})\n`;
        csvContent += `\n`; // Blank line after meta
    }

    // 2. Generate Header Row
    const headers = Object.keys(data[0]);
    csvContent += headers.join(',') + '\n';

    // 3. Generate Data Rows
    data.forEach(row => {
        const line = headers.map(header => {
            let val = row[header];

            if (val === null || val === undefined) {
                return '';
            }

            // Escape strings with commas or quotes
            if (typeof val === 'string') {
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
            }
            return val;
        }).join(',');

        csvContent += line + '\n';
    });

    return csvContent;
}
