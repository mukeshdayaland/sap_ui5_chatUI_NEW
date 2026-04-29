sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";

  return UIComponent.extend("sap.ui5.chat.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this.setModel(new JSONModel({
        messages: [
          {
            role: "assistant",
            text: "How can I help with SuccessFactors today?",
            timestamp: new Date().toISOString()
          }
        ],
        input: "",
        busy: false,
        error: ""
      }), "chat");
    }
  });
});
