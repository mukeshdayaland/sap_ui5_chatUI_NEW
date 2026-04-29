function sanitizeMessage(message) {
  if (typeof message !== "string") {
    const error = new Error("Message is required.");
    error.status = 400;
    error.code = "INVALID_MESSAGE";
    error.safeMessage = "Please enter a message.";
    throw error;
  }

  const sanitized = message.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!sanitized) {
    const error = new Error("Message is empty.");
    error.status = 400;
    error.code = "EMPTY_MESSAGE";
    error.safeMessage = "Please enter a message.";
    throw error;
  }

  if (sanitized.length > 2000) {
    const error = new Error("Message is too long.");
    error.status = 400;
    error.code = "MESSAGE_TOO_LONG";
    error.safeMessage = "Please keep the message under 2000 characters.";
    throw error;
  }

  return sanitized;
}

function normalizeContext(context) {
  if (!Array.isArray(context)) {
    return [];
  }

  return context.slice(-10).map((entry) => ({
    role: entry.role === "assistant" ? "assistant" : "user",
    content: typeof entry.content === "string" ? entry.content.slice(0, 1000) : ""
  }));
}

module.exports = {
  sanitizeMessage,
  normalizeContext
};
