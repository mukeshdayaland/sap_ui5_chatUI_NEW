const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

async function executeIntent({ intent, correlationId }) {
  const destinationName = process.env.MCP_DESTINATION_NAME || "MCP_MIDDLEWARE";

  try {
    const response = await executeHttpRequest(
      { destinationName },
      {
        method: "POST",
        url: "/api/intent",
        data: intent,
        timeout: Number(process.env.MCP_TIMEOUT_MS || 20000),
        headers: {
          "content-type": "application/json",
          "x-correlation-id": correlationId
        }
      },
      {
        fetchCsrfToken: false
      }
    );

    return response.data;
  } catch (error) {
    const normalized = new Error("MCP request failed.");
    normalized.status = error.response?.status || 502;
    normalized.code = "MCP_REQUEST_FAILED";
    normalized.safeMessage = error.response?.data?.error?.message || "The SuccessFactors middleware could not complete the request.";
    throw normalized;
  }
}

module.exports = {
  executeIntent
};
