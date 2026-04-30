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
- `db`: optional placeholder model for future persistence; the current CF deployment does not require HANA because the target space has no HANA entitlement.

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
cf deploy mta_archives/sap_ui5_chatui_new_1.0.0.mtar -f
```

Before deployment, replace placeholder values in `mta.yaml` or use a secure MTA extension descriptor for the LLM, MCP technical client, and SuccessFactors credentials. Do not commit real secrets.

The MTA deploys:

- CAP service module `sap-ui5-chat-srv`
- MCP middleware module `sap-ui5-chat-mcp`
- AppRouter module `sap-ui5-chat-router`
- HTML5 app deployer and app-host/runtime services
- XSUAA, Destination Service, and HTML5 app repository resources

The deployment binds Destination Service for enterprise connectivity patterns. In this CF space, CAP also receives `MCP_BASE_URL` directly from the MTA because destination-content deployment requires landscape-specific destination properties.

SuccessFactors runtime settings are passed to MCP through CF app environment variables from the MTA extension descriptor:

- `SF_API_BASE_URL`
- `SF_TOKEN_URL`
- `SF_CLIENT_ID`
- `SF_CLIENT_SECRET`

## Security Notes

- XSUAA protects AppRouter, CAP and MCP.
- CAP validates authenticated users and checks placeholder scopes before orchestration.
- LLM API keys are read from environment/service bindings only.
- Correlation IDs are propagated as `x-correlation-id`.
- HR payload logging is intentionally avoided.
