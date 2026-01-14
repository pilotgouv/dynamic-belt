
export interface ReportExportMeta {
    organizationName: string;
    generatedAt: string; // ISO Date
    period: { start: string, end: string };
    granularity: 'day' | 'week' | 'month';
    confidence: 'EXACT' | 'ESTIMATED' | 'INCOMPLETE';
    confidenceReasons: string[];
}

export interface ReportExportTableRow {
    [key: string]: string | number | null;
}

export interface ReportExportSeriesPoint {
    date: string;
    [key: string]: string | number | null;
}
