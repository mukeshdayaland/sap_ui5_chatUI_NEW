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
cf deploy mta_archives/sap_ui5_chatui_new_1.0.0.mtar -f --vars-file deployment/cf-vars.yml
```

Before deployment, copy `deployment/cf-vars.example.yml` to `deployment/cf-vars.yml` and provide the LLM, MCP technical client, and SuccessFactors credentials. The real `cf-vars.yml` file is gitignored.

The MTA deploys:

- CAP service module `sap-ui5-chat-srv`
- HANA DB deployer module `sap-ui5-chat-db-deployer`
- MCP middleware module `sap-ui5-chat-mcp`
- AppRouter module `sap-ui5-chat-router`
- HTML5 app deployer and app-host/runtime services
- XSUAA, Destination Service, and HDI container resources

The deployment also creates/updates the `MCP_MIDDLEWARE` destination using OAuth2 Client Credentials.

SuccessFactors runtime settings are passed to MCP through CF app environment variables from the MTA variables file:

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
