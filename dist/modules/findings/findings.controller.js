import { prisma } from "../../db/prisma.js";
import { createAppError, notFoundError } from "../../middleware/errors.js";
import { sendSuccess } from "../../middleware/http.js";
import { ERROR_CODES, ERROR_TYPES } from "../../config/constants.js";
export const getFindingById = async (req, res) => {
    if (!req.authUser?.id) {
        throw createAppError({
            message: "Authentication required to view finding details.",
            status: 401,
            code: ERROR_CODES.INVALID_QUERY_PARAMS,
            type: ERROR_TYPES.INVALID_QUERY_PARAMS
        });
    }
    const id = String(req.params.id);
    const finding = await prisma.finding.findFirst({
        where: {
            id,
            searchRun: {
                userId: req.authUser.id
            }
        },
        include: {
            source: true,
            riskAssessment: true,
            entity: true,
            searchRun: {
                select: {
                    id: true,
                    query: true
                }
            }
        }
    });
    if (!finding) {
        throw notFoundError("Finding not found", { id });
    }
    sendSuccess(res, finding, {}, 200);
};
