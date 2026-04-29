function normalizeError(error) {
  return {
    status: error.status || error.response?.status || 500,
    code: error.code || "MCP_ERROR",
    message: error.status && error.status < 500 ? error.message : "The MCP middleware could not complete the request."
  };
}

module.exports = {
  normalizeError
};
