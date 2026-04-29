const express = require("express");
const helmet = require("helmet");
const passport = require("passport");
const xsenv = require("@sap/xsenv");
const { JWTStrategy } = require("@sap/xssec");
const { v4: uuidv4 } = require("uuid");

const { issueTechnicalToken, authenticateTechnicalToken } = require("./src/auth");
const { dispatchIntent } = require("./src/sf-client");
const { validateIntent } = require("./src/validation");
const { normalizeError } = require("./src/errors");

const app = express();
app.use(helmet());
app.use(express.json({ limit: "128kb" }));

if (process.env.NODE_ENV === "production") {
  const services = xsenv.getServices({ xsuaa: { tag: "xsuaa" } });
  passport.use(new JWTStrategy(services.xsuaa));
  app.use(passport.initialize());
}

app.get("/health", (_req, res) => {
  res.json({ status: "UP", service: "sap-ui5-chat-mcp" });
});

app.post("/auth/token", issueTechnicalToken);

app.post("/api/intent", authenticateTechnicalToken, async (req, res) => {
  const correlationId = req.headers["x-correlation-id"] || uuidv4();

  try {
    const intent = validateIntent(req.body);
    const result = await dispatchIntent(intent, correlationId);
    res.set("x-correlation-id", correlationId).json(result);
  } catch (error) {
    const normalized = normalizeError(error);
    console.warn(JSON.stringify({
      correlationId,
      code: normalized.code,
      status: normalized.status,
      message: normalized.message
    }));

    res.status(normalized.status).set("x-correlation-id", correlationId).json({
      correlationId,
      error: {
        code: normalized.code,
        message: normalized.message
      }
    });
  }
});

const port = process.env.PORT || 4004;
app.listen(port, () => {
  console.log(`MCP middleware listening on ${port}`);
});
