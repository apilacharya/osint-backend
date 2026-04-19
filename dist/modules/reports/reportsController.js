import { notFoundError } from "../../middleware/errors.js";
import { sendSuccess } from "../../middleware/http.js";
import { createReport, getReportById, listReports } from "./reportsService.js";
export const createReportHandler = async (req, res) => {
    const body = req.body;
    const report = await createReport({
        ...body,
        userId: req.authUser.id
    });
    sendSuccess(res, report, {}, 201);
};
export const getReportHandler = async (req, res) => {
    const id = String(req.params.id);
    const report = await getReportById(id);
    if (!report || report.searchRun.userId !== req.authUser.id) {
        throw notFoundError("Report not found", { id });
    }
    const response = {
        ...report,
        searchRun: {
            id: report.searchRun.id,
            query: report.searchRun.query
        }
    };
    sendSuccess(res, response, {}, 200);
};
export const listReportsHandler = async (req, res) => {
    const searchRunId = req.query.searchRunId ? String(req.query.searchRunId) : undefined;
    const format = req.query.format ? String(req.query.format) : undefined;
    const result = await listReports({
        searchRunId,
        format
    }, req.authUser.id);
    sendSuccess(res, result.items, {}, 200);
};
