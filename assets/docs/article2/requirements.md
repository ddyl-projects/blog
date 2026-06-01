# Requirements Document

## Introduction

This feature implements an MCP (Model Context Protocol) server that exposes UK Open Banking Account and Transaction API v4.0.1 operations as tools for AI assistants. The server is built on Spring Boot 4.0.6 with Spring AI 2.0.0-M7 MCP Server starter, communicating over stdio. It provides AI agents with structured access to account listing, balances, products, and transactions endpoints. Authentication token retrieval is delegated to a Spring service class (implementation deferred), and the Open Banking API base URL is externally configurable.

## Glossary

- **MCP_Server**: The Spring Boot application that exposes Open Banking operations as MCP tools over stdio
- **MCP_Tool**: A Spring-managed bean registered with the MCP server that an AI client can invoke to perform a specific Open Banking operation
- **Token_Service**: A Spring service class responsible for providing the OAuth2 Bearer token required to authenticate requests to the Open Banking API
- **HTTP_Client**: The component within the MCP_Server that sends HTTP requests to the Open Banking API endpoints
- **Open_Banking_API**: The external UK Open Banking Account and Transaction API (v4.0.1) hosted by a financial institution (ASPSP)
- **AccountId**: A unique identifier for a PSU's account as defined by the Open Banking specification (1-40 characters)
- **ASPSP**: Account Servicing Payment Service Provider — the financial institution hosting the Open Banking API
- **PSU**: Payment Service User — the end customer whose account data is being accessed

## Requirements

### Requirement 1: Configurable Open Banking API Base URL

**User Story:** As a developer, I want to configure the Open Banking API base URL externally, so that the MCP server can target different ASPSP environments without code changes.

#### Acceptance Criteria

1. THE MCP_Server SHALL read the Open Banking API base URL from the application configuration property `openbanking.api.base-url`
2. IF the `openbanking.api.base-url` property is absent, empty, or contains only whitespace, THEN THE MCP_Server SHALL fail to start and log an error message that includes the property name `openbanking.api.base-url` and indicates it is required
3. THE MCP_Server SHALL use the configured base URL as the prefix for all Open Banking API HTTP requests, stripping any trailing slash from the configured value before prepending it to request paths
4. IF the `openbanking.api.base-url` property value is not a valid URL starting with `https://`, THEN THE MCP_Server SHALL fail to start and log an error message indicating the property value is not a valid HTTPS URL

### Requirement 2: Authentication Token Integration

**User Story:** As a developer, I want the MCP server to obtain authentication tokens from a dedicated Spring service, so that all Open Banking API requests are properly authenticated.

#### Acceptance Criteria

1. THE HTTP_Client SHALL retrieve a Bearer token from the Token_Service before each request to the Open_Banking_API, completing the retrieval within 5 seconds
2. THE HTTP_Client SHALL include the Bearer token in the `Authorization` header using the format `Bearer <token>` for every request to the Open_Banking_API
3. IF the Token_Service returns a null or blank token (zero-length or containing only whitespace), THEN THE MCP_Tool SHALL return an error response indicating that authentication is unavailable and SHALL NOT send the request to the Open_Banking_API
4. IF the Token_Service throws an exception or is unreachable, THEN THE MCP_Tool SHALL return an error response indicating that the token could not be obtained and SHALL NOT send the request to the Open_Banking_API

### Requirement 3: List Accounts Tool

**User Story:** As an AI agent, I want to retrieve a list of PSU accounts, so that I can present account information or use account identifiers for further queries.

#### Acceptance Criteria

1. THE MCP_Server SHALL expose a tool named `list_accounts` that accepts no input parameters and retrieves all accounts from the Open_Banking_API `/accounts` endpoint
2. WHEN the `list_accounts` tool is invoked, THE HTTP_Client SHALL send a GET request to `{base-url}/accounts` with the Authorization header set to the configured Bearer token
3. WHEN the Open_Banking_API returns an HTTP 200 response, THE `list_accounts` tool SHALL return the response body as a JSON string conforming to the OBReadAccount6 schema containing a `Data` object with an `Account` array
4. IF the Open_Banking_API returns a non-200 HTTP response, THEN THE `list_accounts` tool SHALL return an error message containing the HTTP status code and the error details from the response body
5. IF the HTTP_Client fails to connect to the Open_Banking_API within 30 seconds, THEN THE `list_accounts` tool SHALL return an error message indicating a connection timeout

### Requirement 4: Get Account Details Tool

**User Story:** As an AI agent, I want to retrieve details for a specific account by its identifier, so that I can provide detailed account information.

#### Acceptance Criteria

1. THE MCP_Server SHALL expose a tool named `get_account` that accepts a required AccountId parameter (a non-empty string of 1 to 40 characters) and retrieves account details from the Open_Banking_API `/accounts/{AccountId}` endpoint
2. WHEN the `get_account` tool is invoked with a valid AccountId, THE HTTP_Client SHALL send a GET request to `{base-url}/accounts/{AccountId}` with the Authorization header
3. WHEN the Open_Banking_API returns an HTTP 200 response, THE `get_account` tool SHALL return the response body as a JSON string conforming to the OBReadAccount6 schema
4. IF the Open_Banking_API returns a non-200 HTTP response, THEN THE `get_account` tool SHALL return an error message indicating the HTTP status code and the error details from the OBErrorResponse1 body when available
5. IF the `get_account` tool is invoked with an empty or blank AccountId, THEN THE `get_account` tool SHALL return an error message indicating that the AccountId parameter is required and must be between 1 and 40 characters
6. IF the HTTP_Client fails to connect to the Open_Banking_API or the request times out within 30 seconds, THEN THE `get_account` tool SHALL return an error message indicating a connectivity failure

### Requirement 5: Get Account Balances Tool

**User Story:** As an AI agent, I want to retrieve balance information for a specific account, so that I can report the current financial position of that account.

#### Acceptance Criteria

1. THE MCP_Server SHALL expose a tool named `get_balances` that accepts an AccountId parameter (a non-empty string with a maximum length of 40 characters) and retrieves balance data from the Open_Banking_API `/accounts/{AccountId}/balances` endpoint
2. WHEN the `get_balances` tool is invoked with a valid AccountId, THE HTTP_Client SHALL send a GET request to `{base-url}/accounts/{AccountId}/balances` with the Authorization header set to the configured Bearer token
3. WHEN the Open_Banking_API returns a successful response, THE `get_balances` tool SHALL return the response body as a JSON string conforming to the OBReadBalance1 schema (containing a Data object with a Balance array)
4. IF the Open_Banking_API returns an error response (400, 401, 403, 405, 406, 429, or 500), THEN THE `get_balances` tool SHALL return an error message containing the HTTP status code and the error details from the OBErrorResponse1 body when available
5. IF the `get_balances` tool is invoked with an empty or null AccountId, THEN THE `get_balances` tool SHALL return an error message indicating that a valid AccountId is required without making a request to the Open_Banking_API
6. IF the HTTP_Client fails to connect to the Open_Banking_API or the request times out within 30 seconds, THEN THE `get_balances` tool SHALL return an error message indicating a connectivity failure

### Requirement 6: Get Account Product Tool

**User Story:** As an AI agent, I want to retrieve product information for a specific account, so that I can describe the type of financial product associated with that account.

#### Acceptance Criteria

1. THE MCP_Server SHALL expose a tool named `get_product` that accepts a required AccountId parameter of type String and retrieves product data from the Open_Banking_API `/accounts/{AccountId}/product` endpoint
2. WHEN the `get_product` tool is invoked with a non-empty AccountId, THE HTTP_Client SHALL send a GET request to `{base-url}/accounts/{AccountId}/product` with the Authorization header
3. WHEN the Open_Banking_API returns a successful response, THE `get_product` tool SHALL return the response body as a JSON string conforming to the OBReadProduct2 schema
4. IF the Open_Banking_API returns an error response, THEN THE `get_product` tool SHALL return an error message containing the HTTP status code and the error description from the response
5. IF the `get_product` tool is invoked with an empty or null AccountId, THEN THE `get_product` tool SHALL return an error message indicating that AccountId is required without calling the Open_Banking_API
6. IF the HTTP_Client fails to connect to the Open_Banking_API or the request times out within 30 seconds, THEN THE `get_product` tool SHALL return an error message indicating that the upstream service is unavailable

### Requirement 7: Get Account Transactions Tool

**User Story:** As an AI agent, I want to retrieve transactions for a specific account with optional date filtering, so that I can report transaction history for a given period.

#### Acceptance Criteria

1. THE MCP_Server SHALL expose a tool named `get_transactions` that accepts a required AccountId parameter (non-empty string, maximum 40 characters) and optional `fromBookingDateTime` and `toBookingDateTime` parameters in ISO 8601 date-time format, and retrieves transaction data from the Open_Banking_API `/accounts/{AccountId}/transactions` endpoint
2. WHEN the `get_transactions` tool is invoked with a valid AccountId, THE HTTP_Client SHALL send a GET request to `{base-url}/accounts/{AccountId}/transactions` with the Authorization header
3. WHERE the `fromBookingDateTime` parameter is provided, THE HTTP_Client SHALL include it as a query parameter named `fromBookingDateTime` in the request to the Open_Banking_API
4. WHERE the `toBookingDateTime` parameter is provided, THE HTTP_Client SHALL include it as a query parameter named `toBookingDateTime` in the request to the Open_Banking_API
5. WHEN the Open_Banking_API returns a successful response, THE `get_transactions` tool SHALL return the response body as a JSON string conforming to the OBReadTransaction6 schema
6. IF the Open_Banking_API returns a non-2xx HTTP status code, THEN THE `get_transactions` tool SHALL return an error message containing the HTTP status code and error details from the response body
7. IF the `get_transactions` tool is invoked with an empty or blank AccountId, THEN THE `get_transactions` tool SHALL return an error message indicating that AccountId is required
8. IF the `get_transactions` tool is invoked with a `fromBookingDateTime` or `toBookingDateTime` value that is not valid ISO 8601 date-time format, THEN THE `get_transactions` tool SHALL return an error message indicating the invalid date format

### Requirement 8: MCP Tool Registration

**User Story:** As a developer, I want all Open Banking tools to be automatically registered with the MCP server at startup, so that AI clients can discover and invoke them without manual configuration.

#### Acceptance Criteria

1. THE MCP_Server SHALL register all five Open Banking tools (list_accounts, get_account, get_balances, get_product, get_transactions) as Spring-managed beans exposed via the Spring AI MCP Server framework
2. THE MCP_Server SHALL communicate with AI clients over stdio transport
3. WHEN an AI client connects, THE MCP_Server SHALL make all registered tools discoverable with their names, descriptions, and parameter schemas

### Requirement 9: HTTP Request Headers

**User Story:** As a developer, I want the MCP server to include the required FAPI headers in Open Banking API requests, so that requests comply with the Open Banking specification.

#### Acceptance Criteria

1. THE HTTP_Client SHALL include the `x-fapi-interaction-id` header with a newly generated RFC4122 UUID version 4 value in every request to the Open_Banking_API, such that no two requests share the same `x-fapi-interaction-id` value
2. THE HTTP_Client SHALL set the `Accept` header to `application/json` in every request to the Open_Banking_API
3. THE HTTP_Client SHALL include the `Authorization` header with a Bearer token value in every request to the Open_Banking_API
4. IF the HTTP_Client receives a response from the Open_Banking_API that includes an `x-fapi-interaction-id` header, THEN THE HTTP_Client SHALL include the response `x-fapi-interaction-id` value in the result returned to the MCP tool caller

### Requirement 10: Stdio Transport Security

**User Story:** As a developer, I want the MCP server to communicate exclusively over stdio, so that only the parent process that spawned the server can interact with it, eliminating remote attack vectors.

#### Acceptance Criteria

1. THE MCP_Server SHALL communicate with AI clients exclusively over standard input (stdin) and standard output (stdout) using the stdio transport mode
2. THE MCP_Server SHALL NOT open any network port or bind to any network interface for the purpose of MCP client communication
3. THE MCP_Server SHALL rely on process-level isolation provided by the operating system, such that only the parent process that spawned the MCP_Server process can read from or write to the stdio streams
4. IF the MCP_Server detects that stdin has been closed or has reached end-of-stream, THEN THE MCP_Server SHALL terminate gracefully within 5 seconds
5. THE MCP_Server SHALL write all diagnostic and log output to standard error (stderr) to avoid corrupting the MCP protocol messages on stdout
