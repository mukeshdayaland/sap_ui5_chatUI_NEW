sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/base/Log"
], function (Controller, Log) {
  "use strict";

  return Controller.extend("sap.ui5.chat.controller.Chat", {
    onSend: async function () {
      const model = this.getView().getModel("chat");
      const input = (model.getProperty("/input") || "").trim();
      if (!input) {
        return;
      }

      this._addMessage("user", input);
      model.setProperty("/input", "");
      model.setProperty("/busy", true);
      model.setProperty("/error", "");
      this._scrollToBottom();

      try {
        const response = await fetch("/chat/query", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-correlation-id": this._newCorrelationId()
          },
          body: JSON.stringify({
            message: input,
            context: this._contextForBackend()
          })
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error && payload.error.message ? payload.error.message : "Request failed.");
        }

        this._addMessage("assistant", this._formatAnswer(payload));
      } catch (error) {
        Log.error("Chat request failed", error.message);
        model.setProperty("/error", error.message || "The assistant could not complete the request.");
      } finally {
        model.setProperty("/busy", false);
        this._scrollToBottom();
      }
    },

    onCloseError: function () {
      this.getView().getModel("chat").setProperty("/error", "");
    },

    _addMessage: function (role, text) {
      const model = this.getView().getModel("chat");
      const messages = model.getProperty("/messages").slice();
      messages.push({
        role,
        text,
        timestamp: new Date().toISOString()
      });
      model.setProperty("/messages", messages);
    },

    _contextForBackend: function () {
      return this.getView().getModel("chat").getProperty("/messages")
        .slice(-8)
        .map(function (message) {
          return {
            role: message.role,
            content: message.text
          };
        });
    },

    _formatAnswer: function (payload) {
      if (payload.data) {
        return payload.answer + "\n\n" + JSON.stringify(payload.data, null, 2);
      }
      return payload.answer;
    },

    _scrollToBottom: function () {
      setTimeout(function () {
        const scroller = this.byId("messageScroller");
        if (scroller) {
          scroller.scrollTo(0, 999999, 300);
        }
      }.bind(this), 0);
    },

    _newCorrelationId: function () {
      if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
      }
      return "ui-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }
  });
});
