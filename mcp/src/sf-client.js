const axios = require("axios");
const { getSuccessFactorsToken } = require("./token-cache");

function baseUrl() {
  const url = process.env.SF_API_BASE_URL;
  if (!url) {
    const error = new Error("SuccessFactors API base URL is missing.");
    error.status = 500;
    error.code = "SF_API_NOT_CONFIGURED";
    throw error;
  }
  return url.replace(/\/$/, "");
}

async function sfGet(path, params, correlationId) {
  const token = await getSuccessFactorsToken(correlationId);
  const response = await axios.get(`${baseUrl()}${path}`, {
    params,
    timeout: Number(process.env.SF_API_TIMEOUT_MS || 20000),
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      "x-correlation-id": correlationId
    }
  });

  return response.data;
}

function normalizeOData(payload) {
  const results = payload?.d?.results || payload?.value || payload?.d || payload;
  return Array.isArray(results) ? results : [results].filter(Boolean);
}

async function getEmployeeProfile(intent, correlationId) {
  const name = intent.parameters.name || intent.filters.name;
  const userId = intent.parameters.userId || intent.filters.userId;
  const params = {
    $format: "json",
    $select: "userId,firstName,lastName,email,department,division,title,manager/userId",
    $expand: "manager"
  };

  if (userId) {
    params.$filter = `userId eq '${String(userId).replace(/'/g, "''")}'`;
  } else if (name) {
    const safeName = String(name).replace(/'/g, "''");
    params.$filter = `substringof('${safeName}',firstName) or substringof('${safeName}',lastName)`;
  }

  const data = normalizeOData(await sfGet("/User", params, correlationId));
  return {
    message: data.length ? "Employee profile retrieved from SuccessFactors." : "No employee profile matched the request.",
    data
  };
}

async function listOpenPositions(intent, correlationId) {
  const params = {
    $format: "json",
    $select: "code,positionTitle,department,division,effectiveStatus",
    $filter: "effectiveStatus eq 'A'"
  };

  if (intent.filters.department) {
    params.$filter += ` and department eq '${String(intent.filters.department).replace(/'/g, "''")}'`;
  }

  const data = normalizeOData(await sfGet("/Position", params, correlationId));
  return {
    message: `${data.length} open position record(s) retrieved from SuccessFactors.`,
    data
  };
}

async function getReportingHierarchy(intent, correlationId) {
  const userId = intent.parameters.userId || intent.filters.userId;
  if (!userId) {
    const error = new Error("A userId is required for reporting hierarchy.");
    error.status = 400;
    error.code = "MISSING_USER_ID";
    throw error;
  }

  const data = normalizeOData(await sfGet("/User", {
    $format: "json",
    $filter: `userId eq '${String(userId).replace(/'/g, "''")}'`,
    $select: "userId,firstName,lastName,manager/userId,manager/firstName,manager/lastName",
    $expand: "manager"
  }, correlationId));

  return {
    message: "Reporting hierarchy retrieved from SuccessFactors.",
    data
  };
}

async function checkLeaveBalance(intent, correlationId) {
  const userId = intent.parameters.userId || intent.filters.userId;
  if (!userId) {
    const error = new Error("A userId is required for leave balance.");
    error.status = 400;
    error.code = "MISSING_USER_ID";
    throw error;
  }

  const data = normalizeOData(await sfGet("/EmployeeTimeAccountBalance", {
    $format: "json",
    $filter: `userId eq '${String(userId).replace(/'/g, "''")}'`,
    $select: "userId,timeAccountType,bookableAmount,unit"
  }, correlationId));

  return {
    message: "Leave balance retrieved from SuccessFactors.",
    data
  };
}

async function dispatchIntent(intent, correlationId) {
  switch (intent.intent) {
    case "getEmployeeProfile":
      return getEmployeeProfile(intent, correlationId);
    case "listOpenPositions":
      return listOpenPositions(intent, correlationId);
    case "getReportingHierarchy":
      return getReportingHierarchy(intent, correlationId);
    case "checkLeaveBalance":
      return checkLeaveBalance(intent, correlationId);
    default:
      throw Object.assign(new Error("Unsupported intent."), {
        status: 400,
        code: "UNSUPPORTED_INTENT"
      });
  }
}

module.exports = {
  dispatchIntent
};
