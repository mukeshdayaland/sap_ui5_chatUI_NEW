const SUPPORTED_INTENTS = new Set([
  "getEmployeeProfile",
  "listOpenPositions",
  "getReportingHierarchy",
  "checkLeaveBalance"
]);

function validateIntent(payload) {
  if (!payload || typeof payload !== "object") {
    const error = new Error("Intent payload is required.");
    error.status = 400;
    error.code = "INVALID_INTENT";
    throw error;
  }

  if (!SUPPORTED_INTENTS.has(payload.intent)) {
    const error = new Error("Unsupported SuccessFactors intent.");
    error.status = 400;
    error.code = "UNSUPPORTED_INTENT";
    throw error;
  }

  return {
    intent: payload.intent,
    entity: String(payload.entity || ""),
    parameters: payload.parameters && typeof payload.parameters === "object" ? payload.parameters : {},
    filters: payload.filters && typeof payload.filters === "object" ? payload.filters : {},
    requiredPermissions: Array.isArray(payload.requiredPermissions) ? payload.requiredPermissions : []
  };
}

module.exports = {
  validateIntent
};
