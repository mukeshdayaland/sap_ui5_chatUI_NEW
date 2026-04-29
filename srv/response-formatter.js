function formatAssistantResponse(intent, mcpResponse) {
  if (mcpResponse && mcpResponse.message) {
    return mcpResponse.message;
  }

  const count = Array.isArray(mcpResponse?.data) ? mcpResponse.data.length : mcpResponse?.data ? 1 : 0;

  switch (intent.intent) {
    case "getEmployeeProfile":
      return count ? "Here is the employee profile information I found." : "I could not find a matching employee profile.";
    case "listOpenPositions":
      return count ? `I found ${count} open position${count === 1 ? "" : "s"}.` : "I could not find open positions for that request.";
    case "getReportingHierarchy":
      return count ? "Here is the reporting hierarchy." : "I could not find the reporting hierarchy.";
    case "checkLeaveBalance":
      return count ? "Here is the leave balance information." : "I could not find leave balance information.";
    default:
      return "I completed the request.";
  }
}

module.exports = {
  formatAssistantResponse
};
