import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReportService } from "@/services/reportService";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, config, range, reportDefinitionId } = await req.json();

    if (!organizationId || !range) {
        return NextResponse.json({ error: "Missing required params" }, { status: 400 });
    }

    try {
        const startDate = new Date(range.start);
        const endDate = new Date(range.end);
        endDate.setHours(23, 59, 59, 999);

        // Run Calculation
        const result = await ReportService.runReport(
            organizationId,
            config,
            {
                start: startDate,
                end: endDate,
                granularity: range.granularity || 'day'
            }
        );

        // If this is a run for a saved report, we could persist it to ReportRun.
        // For V2.5.0 we just return the result for preview.
        if (reportDefinitionId) {
            await prisma.reportRun.create({
                data: {
                    reportDefinitionId,
                    organizationId,
                    startDate: new Date(range.start),
                    endDate: new Date(range.end),
                    granularity: range.granularity || 'day',
                    status: 'success',
                    result: result as any
                }
            });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Report Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
