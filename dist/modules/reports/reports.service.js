import { ReportFormat } from "@prisma/client";
import PDFDocument from "pdfkit";
import { prisma } from "../../db/prisma.js";
import { notFoundError, reportGenerationError } from "../../middleware/errors.js";
const createMarkdown = (run) => {
    const lines = [
        `# OSINT Report: ${run.query}`,
        "",
        `- Search Run ID: ${run.id}`,
        `- Generated At: ${new Date().toISOString()}`,
        `- Findings: ${run.findings.length}`,
        ""
    ];
    for (const finding of run.findings) {
        lines.push(`## ${finding.title}`);
        lines.push(`Category: ${finding.category}`);
        lines.push(`Confidence: ${finding.confidence}`);
        lines.push(`Source: ${finding.source.url}`);
        lines.push(`Retrieved: ${finding.retrievedAt.toISOString()}`);
        lines.push(`Summary: ${finding.summary}`);
        if (finding.riskAssessment) {
            lines.push(`Risk: ${finding.riskAssessment.severity} (${finding.riskAssessment.score})`);
            lines.push(`Rationale: ${finding.riskAssessment.rationale}`);
        }
        lines.push("");
    }
    return lines.join("\n");
};
const renderPdfBase64 = async (markdown) => new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 40 });
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", (error) => reject(error));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.fontSize(11).text(markdown);
    doc.end();
});
export const createReport = async (input) => {
    const run = await prisma.searchRun.findFirst({
        where: {
            id: input.searchRunId,
            userId: input.userId
        },
        include: {
            findings: {
                include: {
                    source: true,
                    riskAssessment: true
                },
                orderBy: { confidence: "desc" }
            }
        }
    });
    if (!run) {
        throw notFoundError("Search run not found for report generation", { searchRunId: input.searchRunId });
    }
    if (run.findings.length === 0) {
        throw reportGenerationError("Cannot generate report without findings", { searchRunId: run.id });
    }
    const markdown = createMarkdown(run);
    const format = input.format === "pdf" ? ReportFormat.PDF : ReportFormat.MARKDOWN;
    const content = format === ReportFormat.PDF ? await renderPdfBase64(markdown) : markdown;
    const extension = format === ReportFormat.PDF ? "pdf" : "md";
    return prisma.report.create({
        data: {
            searchRunId: run.id,
            format,
            fileName: `osint-report-${run.id}.${extension}`,
            content
        }
    });
};
export const getReportById = async (id) => prisma.report.findUnique({
    where: { id },
    include: {
        searchRun: {
            select: {
                id: true,
                query: true,
                userId: true
            }
        }
    }
});
export const listReports = async (filters, userId) => {
    const where = {
        searchRun: {
            userId
        },
        ...(filters.searchRunId ? { searchRunId: filters.searchRunId } : {}),
        ...(filters.format ? { format: filters.format } : {})
    };
    const items = await prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            searchRun: {
                select: {
                    id: true,
                    query: true
                }
            }
        }
    });
    return { items };
};
