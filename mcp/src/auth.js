const crypto = require("crypto");

const tokens = new Map();

function configuredClient() {
  return {
    id: process.env.MCP_CLIENT_ID,
    secret: process.env.MCP_CLIENT_SECRET
  };
}

function issueTechnicalToken(req, res) {
  const client = configuredClient();
  const authHeader = req.headers.authorization || "";
  const basic = authHeader.startsWith("Basic ") ? authHeader.slice(6) : "";
  const decoded = basic ? Buffer.from(basic, "base64").toString("utf8") : "";
  const [clientId, clientSecret] = decoded.split(":");

  const bodyClientId = req.body?.client_id;
  const bodyClientSecret = req.body?.client_secret;

  const valid =
    client.id &&
    client.secret &&
    ((clientId === client.id && clientSecret === client.secret) ||
      (bodyClientId === client.id && bodyClientSecret === client.secret));

  if (!valid) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Invalid MCP client credentials."
    });
  }

  const accessToken = crypto.randomBytes(32).toString("hex");
  const expiresIn = 300;
  tokens.set(accessToken, Date.now() + expiresIn * 1000);

  return res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn
  });
}

function authenticateTechnicalToken(req, res, next) {
  if (process.env.NODE_ENV !== "production" && !process.env.MCP_CLIENT_SECRET) {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const expiresAt = tokens.get(token);

  if (!expiresAt || expiresAt < Date.now()) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or expired MCP access token."
      }
    });
  }

  return next();
}

module.exports = {
  issueTechnicalToken,
  authenticateTechnicalToken
};
