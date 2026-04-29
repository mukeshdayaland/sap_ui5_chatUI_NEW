const cds = require("@sap/cds");

module.exports = cds.service.impl(function () {
  this.on("health", () => ({
    status: "UP",
    service: "sap-ui5-chat-bff"
  }));
});
