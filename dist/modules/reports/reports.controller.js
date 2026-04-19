import { createAppError, notFoundError } from "../../middleware/errors.js";
import { sendSuccess } from "../../middleware/http.js";
import { createReport, getReportById, listReports } from "./reports.service.js";
import { ERROR_CODES, ERROR_TYPES } from "../../config/constants.js";
export const createReportHandler = async (req, res) => {
    if (!req.authUser?.id) {
        throw createAppError({
            message: "Authentication required to create reports.",
            status: 401,
            code: ERROR_CODES.INVALID_QUERY_PARAMS,
            type: ERROR_TYPES.INVALID_QUERY_PARAMS
        });
    }
    const body = req.body;
    const report = await createReport({
        ...body,
        userId: req.authUser.id
    });
    sendSuccess(res, report, {}, 201);
};
export const getReportHandler = async (req, res) => {
    if (!req.authUser?.id) {
        throw createAppError({
            message: "Authentication required to view reports.",
            status: 401,
            code: ERROR_CODES.INVALID_QUERY_PARAMS,
            type: ERROR_TYPES.INVALID_QUERY_PARAMS
        });
    }
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
    if (!req.authUser?.id) {
        throw createAppError({
            message: "Authentication required to view reports.",
            status: 401,
            code: ERROR_CODES.INVALID_QUERY_PARAMS,
            type: ERROR_TYPES.INVALID_QUERY_PARAMS
        });
    }
    const searchRunId = req.query.searchRunId ? String(req.query.searchRunId) : undefined;
    const format = req.query.format ? String(req.query.format) : undefined;
    const result = await listReports({
        searchRunId,
        format
    }, req.authUser.id);
    sendSuccess(res, result.items, {}, 200);
};
