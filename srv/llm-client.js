const axios = require("axios");

const SYSTEM_PROMPT = "You are an enterprise SAP SuccessFactors assistant. Convert the user's natural-language request into structured JSON. Return JSON only. Do not include explanations. Include intent, entity, parameters, filters, and requiredPermissions.";

function llmConfig() {
  return {
    apiKey: process.env.LLM_API_KEY,
    apiUrl: process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions",
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    timeout: Number(process.env.LLM_TIMEOUT_MS || 20000)
  };
}

function parseJsonOnly(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    const fallbackMatch = content.match(/\{[\s\S]*\}/);
    if (fallbackMatch) {
      return JSON.parse(fallbackMatch[0]);
    }
    throw error;
  }
}

function validateIntent(intent) {
  if (!intent || typeof intent !== "object" || !intent.intent || !intent.entity) {
    const error = new Error("LLM returned an invalid intent.");
    error.status = 502;
    error.code = "INVALID_LLM_INTENT";
    error.safeMessage = "I could not understand the request well enough to call SuccessFactors.";
    throw error;
  }

  return {
    intent: String(intent.intent),
    entity: String(intent.entity),
    parameters: intent.parameters && typeof intent.parameters === "object" ? intent.parameters : {},
    filters: intent.filters && typeof intent.filters === "object" ? intent.filters : {},
    requiredPermissions: Array.isArray(intent.requiredPermissions) ? intent.requiredPermissions : []
  };
}

async function buildIntent({ message, context, correlationId }) {
  const config = llmConfig();
  if (!config.apiKey) {
    const error = new Error("LLM_API_KEY is not configured.");
    error.status = 500;
    error.code = "LLM_NOT_CONFIGURED";
    error.safeMessage = "The assistant is not configured with an LLM provider.";
    throw error;
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...context,
    { role: "user", content: message }
  ];

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await axios.post(
        config.apiUrl,
        {
          model: config.model,
          messages,
          temperature: 0,
          response_format: { type: "json_object" }
        },
        {
          timeout: config.timeout,
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
            "x-correlation-id": correlationId
          }
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      return validateIntent(parseJsonOnly(content || "{}"));
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  lastError.status = 502;
  lastError.code = "LLM_REQUEST_FAILED";
  lastError.safeMessage = "The assistant could not classify the request.";
  throw lastError;
}

module.exports = {
  buildIntent,
  SYSTEM_PROMPT
};
