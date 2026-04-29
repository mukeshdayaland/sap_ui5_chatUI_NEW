# SAP BTP Cloud Foundry Deployment

Use this folder for deployment-time values that must not be committed with real secrets.

## Required Variables

Copy `cf-vars.example.yml` to `cf-vars.yml` and replace the values:

```yaml
mcp-client-id: mcp-client
mcp-client-secret: a-long-random-secret
llm-api-key: your-llm-provider-key
sf-api-base-url: https://api.successfactors.com/odata/v2
sf-token-url: https://your-sf-oauth-token-url
sf-client-id: your-successfactors-client-id
sf-client-secret: your-successfactors-client-secret
```

Deploy with:

```bash
mbt build
cf deploy mta_archives/sap_ui5_chatui_new_1.0.0.mtar -f --vars-file deployment/cf-vars.yml
```

The variables file is used by the MTA to configure:

- CAP `LLM_API_KEY`
- MCP technical client credentials
- MCP SuccessFactors OAuth/API configuration
- Destination Service entry `MCP_MIDDLEWARE`

If you rotate secrets after deployment, update the app environment and redeploy or restage:

```bash
cf set-env sap-ui5-chat-srv LLM_API_KEY "<llm-api-key>"
cf set-env sap-ui5-chat-mcp MCP_CLIENT_ID "mcp-client"
cf set-env sap-ui5-chat-mcp MCP_CLIENT_SECRET "<same-secret-as-cf-vars>"
cf set-env sap-ui5-chat-mcp SF_API_BASE_URL "https://<sf-host>/odata/v2"
cf set-env sap-ui5-chat-mcp SF_TOKEN_URL "https://<sf-token-url>"
cf set-env sap-ui5-chat-mcp SF_CLIENT_ID "<sf-client-id>"
cf set-env sap-ui5-chat-mcp SF_CLIENT_SECRET "<sf-client-secret>"
cf restage sap-ui5-chat-srv
cf restage sap-ui5-chat-mcp
```
