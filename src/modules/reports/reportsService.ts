import { Prisma, ReportFormat } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { notFoundError, reportGenerationError } from "../../middleware/errors.js";
import { generateMarkdown, generatePdfBase64 } from "../../services/reporting/reportGenerators.js";

type ReportInput = {
  searchRunId: string;
  format: "markdown" | "pdf";
  userId: string;
};

export const createReport = async (input: ReportInput) => {
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

  const markdown = generateMarkdown(run);
  const format = input.format === "pdf" ? ReportFormat.PDF : ReportFormat.MARKDOWN;
  const content = format === ReportFormat.PDF ? await generatePdfBase64(markdown) : markdown;
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

export const getReportById = async (id: string) =>
  prisma.report.findUnique({
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

type ReportListFilters = {
  searchRunId?: string;
  format?: ReportFormat;
};

export const listReports = async (filters: ReportListFilters, userId: string) => {
  const where: Prisma.ReportWhereInput = {
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
