# SAPUI5 ChatGPT-Style SuccessFactors Assistant

Production-oriented SAP BTP Cloud Foundry scaffold using SAP CAP Node.js, SAPUI5, AppRouter, XSUAA, Destination Service, and a dedicated MCP middleware service for SAP SuccessFactors.

## Architecture

```text
SAPUI5 Chat UI
-> SAP Application Router
-> XSUAA Authentication
-> SAP CAP Node.js Backend (BFF)
-> LLM API
-> SAP Destination Service
-> MCP Middleware on Cloud Foundry
-> MCP Authentication Layer
-> SAP SuccessFactors APIs
-> MCP Normalized Response
-> CAP Response Formatter
-> SAPUI5 Chat UI
```

The UI never calls SuccessFactors, the LLM, or MCP directly. Secrets are stored only in service bindings or environment variables.

## Modules

- `app/chat-ui`: SAPUI5 MVC chat interface.
- `app/router`: SAP Application Router.
- `srv`: CAP backend/BFF exposing `POST /chat/query`.
- `mcp`: dedicated middleware service that owns SuccessFactors authentication and normalization.
- `db`: placeholder CAP database module.

## Local Setup

```bash
npm install
npm run watch
```

Create `default-env.json` from `default-env.json.example` for local testing.

## BTP Deployment

```bash
npm install
cds build
mbt build
cf deploy mta_archives/sap_ui5_chatui_new_1.0.0.mtar
```

Configure destinations:

- `MCP_MIDDLEWARE`: points to deployed MCP middleware.
- `SF_API`: points to SAP SuccessFactors API base URL, consumed only by MCP.

## Security Notes

- XSUAA protects AppRouter, CAP and MCP.
- CAP validates authenticated users and checks placeholder scopes before orchestration.
- LLM API keys are read from environment/service bindings only.
- Correlation IDs are propagated as `x-correlation-id`.
- HR payload logging is intentionally avoided.
