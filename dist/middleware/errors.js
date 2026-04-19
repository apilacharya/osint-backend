import { ERROR_CODES, ERROR_TYPES } from "../config/constants.js";
export const createAppError = (params) => {
    const error = new Error(params.message);
    error.status = params.status;
    error.code = params.code;
    error.type = params.type;
    error.details = params.details ?? null;
    error.isAppError = true;
    return error;
};
export const isAppError = (error) => typeof error === "object" && error !== null && "isAppError" in error && error.isAppError === true;
export const notFoundError = (message, details) => createAppError({
    message,
    status: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    type: ERROR_TYPES.RESOURCE_NOT_FOUND,
    details
});
export const invalidQueryError = (message, details) => createAppError({
    message,
    status: 400,
    code: ERROR_CODES.INVALID_QUERY_PARAMS,
    type: ERROR_TYPES.INVALID_QUERY_PARAMS,
    details
});
export const authenticationRequiredError = (message = "Authentication required for this operation.") => createAppError({
    message,
    status: 401,
    code: ERROR_CODES.INVALID_QUERY_PARAMS,
    type: ERROR_TYPES.INVALID_QUERY_PARAMS,
    details: null
});
export const adapterError = (message, details) => createAppError({
    message,
    status: 502,
    code: ERROR_CODES.ADAPTER_UPSTREAM_ERROR,
    type: ERROR_TYPES.ADAPTER_UPSTREAM_ERROR,
    details
});
export const entityResolutionError = (message, details) => createAppError({
    message,
    status: 422,
    code: ERROR_CODES.ENTITY_RESOLUTION_FAILED,
    type: ERROR_TYPES.ENTITY_RESOLUTION_FAILED,
    details
});
export const reportGenerationError = (message, details) => createAppError({
    message,
    status: 500,
    code: ERROR_CODES.REPORT_GENERATION_FAILED,
    type: ERROR_TYPES.REPORT_GENERATION_FAILED,
    details
});
