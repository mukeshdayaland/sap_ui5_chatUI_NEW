const cds = require("@sap/cds");
const express = require("express");
const helmet = require("helmet");
const passport = require("passport");
const xsenv = require("@sap/xsenv");
const { JWTStrategy } = require("@sap/xssec");
const { v4: uuidv4 } = require("uuid");

const { buildIntent } = require("./llm-client");
const { executeIntent } = require("./mcp-client");
const { formatAssistantResponse } = require("./response-formatter");
const { sanitizeMessage, normalizeContext } = require("./validation");

let xsappname = "";

function configurePassport() {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const services = xsenv.getServices({ xsuaa: { tag: "xsuaa" } });
  xsappname = services.xsuaa.xsappname;
  passport.use(new JWTStrategy(services.xsuaa));
  return true;
}

function requireScope(req, scope) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const authInfo = req.authInfo;
  const fullScope = xsappname ? `${xsappname}.${scope}` : scope;
  const hasScope = authInfo && (
    authInfo.checkScope(fullScope) ||
    (typeof authInfo.checkLocalScope === "function" && authInfo.checkLocalScope(scope))
  );

  if (!hasScope) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }
}

cds.on("bootstrap", (app) => {
  app.use(helmet());
  app.use(express.json({ limit: "128kb" }));

  const xsuaaEnabled = configurePassport();
  if (xsuaaEnabled) {
    app.use(passport.initialize());
  }

  const authenticate = xsuaaEnabled
    ? passport.authenticate("JWT", { session: false })
    : (_req, _res, next) => next();

  app.post("/chat/query", authenticate, async (req, res) => {
    const correlationId = req.headers["x-correlation-id"] || uuidv4();

    try {
      requireScope(req, "ChatUser");

      const message = sanitizeMessage(req.body && req.body.message);
      const context = normalizeContext(req.body && req.body.context);

      const intent = await buildIntent({ message, context, correlationId });
      const mcpResponse = await executeIntent({ intent, correlationId });
      const answer = formatAssistantResponse(intent, mcpResponse);

      res.set("x-correlation-id", correlationId).json({
        correlationId,
        answer,
        intent,
        data: mcpResponse.data || null
      });
    } catch (error) {
      const status = error.status || error.responseStatus || 500;
      cds.log("chat").warn({
        correlationId,
        status,
        code: error.code || "CHAT_QUERY_FAILED",
        message: error.safeMessage || error.message
      });

      res.status(status).set("x-correlation-id", correlationId).json({
        correlationId,
        error: {
          code: error.code || "CHAT_QUERY_FAILED",
          message: error.safeMessage || "The assistant could not complete the request."
        }
      });
    }
  });
});

module.exports = cds.server;
