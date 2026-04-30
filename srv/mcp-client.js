const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const axios = require("axios");

async function getMcpAccessToken({ baseUrl, correlationId }) {
  const clientId = process.env.MCP_CLIENT_ID;
  const clientSecret = process.env.MCP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await axios.post(
    `${baseUrl.replace(/\/$/, "")}/auth/token`,
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret
    }),
    {
      timeout: Number(process.env.MCP_TIMEOUT_MS || 20000),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-correlation-id": correlationId
      }
    }
  );

  return response.data.access_token;
}

async function executeIntentDirect({ intent, correlationId }) {
  const baseUrl = process.env.MCP_BASE_URL;
  if (!baseUrl) {
    return null;
  }

  const token = await getMcpAccessToken({ baseUrl, correlationId });
  const response = await axios.post(
    `${baseUrl.replace(/\/$/, "")}/api/intent`,
    intent,
    {
      timeout: Number(process.env.MCP_TIMEOUT_MS || 20000),
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
        ...(token ? { authorization: `Bearer ${token}` } : {})
      }
    }
  );

  return response.data;
}

async function executeIntent({ intent, correlationId }) {
  const directResponse = await executeIntentDirect({ intent, correlationId });
  if (directResponse) {
    return directResponse;
  }

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
