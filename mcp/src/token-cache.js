const axios = require("axios");

let cachedToken = null;
let expiresAt = 0;

async function getSuccessFactorsToken(correlationId) {
  if (cachedToken && expiresAt > Date.now() + 30000) {
    return cachedToken;
  }

  const tokenUrl = process.env.SF_TOKEN_URL;
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;

  if (!tokenUrl || !clientId || !clientSecret) {
    const error = new Error("SuccessFactors OAuth configuration is missing.");
    error.status = 500;
    error.code = "SF_AUTH_NOT_CONFIGURED";
    throw error;
  }

  const response = await axios.post(
    tokenUrl,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      timeout: Number(process.env.SF_AUTH_TIMEOUT_MS || 15000),
      auth: {
        username: clientId,
        password: clientSecret
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-correlation-id": correlationId
      }
    }
  );

  cachedToken = response.data.access_token;
  expiresAt = Date.now() + Number(response.data.expires_in || 300) * 1000;
  return cachedToken;
}

module.exports = {
  getSuccessFactorsToken
};
