# Implementation Plan: Open Banking MCP Tools

## Overview

Implement an MCP server exposing UK Open Banking Account and Transaction API v4.0.1 operations as tools for AI assistants. The server uses Spring Boot 4.0.6 with Spring AI 2.0.0-M7 MCP Server starter, communicating over stdio. Implementation follows a layered approach: configuration → token service → HTTP client → tool classes → testing.

## Tasks

- [x] 1. Set up project structure, configuration, and dependencies
  - [x] 1.1 Add jqwik dependency and configure pom.xml
    - Add `net.jqwik:jqwik:1.9.2` test dependency to `pom.xml`
    - Add `spring-boot-starter-validation` dependency for `@Validated` / `@ConfigurationProperties` support
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.2 Create `OpenBankingProperties` configuration class
    - Create `src/main/java/com/dyl/openbanking_mcp/config/OpenBankingProperties.java`
    - Annotate with `@ConfigurationProperties(prefix = "openbanking.api")` and `@Validated`
    - Add `baseUrl` field with `@NotBlank` and `@Pattern(regexp = "^https://.*")` validation
    - Add `connectTimeout` (default 30) and `requestTimeout` (default 30) fields
    - Add `@PostConstruct` method to strip trailing slashes from `baseUrl`
    - Enable configuration properties scanning in the application class with `@EnableConfigurationProperties`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.3 Update `application.yaml` with MCP server and Open Banking configuration
    - Add `spring.ai.mcp.server.stdio: true`, `spring.ai.mcp.server.type: SYNC`, `spring.ai.mcp.server.name: openbanking-mcp`, `spring.ai.mcp.server.version: 1.0.0`
    - Add `spring.main.banner-mode: off`
    - Add `openbanking.api.base-url: ${OPENBANKING_API_BASE_URL}` placeholder
    - Add `openbanking.api.connect-timeout: 30` and `openbanking.api.request-timeout: 30`
    - Configure logging to write to stderr (add `logback-spring.xml` that directs output to `System.err`)
    - _Requirements: 1.1, 8.2, 10.1, 10.5_

  - [x] 1.4 Create `logback-spring.xml` for stderr logging
    - Create `src/main/resources/logback-spring.xml`
    - Configure console appender to write to `System.err` instead of `System.out`
    - Ensure no log output goes to stdout (reserved for MCP protocol messages)
    - _Requirements: 10.5_

- [x] 2. Implement token service layer
  - [x] 2.1 Create `TokenService` interface and `DefaultTokenService` implementation
    - Create `src/main/java/com/dyl/openbanking_mcp/token/TokenService.java` interface with `String getToken()` method
    - Create `src/main/java/com/dyl/openbanking_mcp/token/DefaultTokenService.java` as a `@Component` placeholder that throws `UnsupportedOperationException`
    - Document that this is a placeholder to be replaced with a real OAuth2 implementation
    - _Requirements: 2.1_

  - [x] 2.2 Write unit tests for TokenService
    - Create `src/test/java/com/dyl/openbanking_mcp/token/TokenServiceTests.java`
    - Test that `DefaultTokenService.getToken()` throws `UnsupportedOperationException`
    - _Requirements: 2.1_

- [x] 3. Implement HTTP client layer
  - [x] 3.1 Create `OpenBankingClientException` custom exception
    - Create `src/main/java/com/dyl/openbanking_mcp/client/OpenBankingClientException.java`
    - Extend `RuntimeException` with constructors for message and cause
    - _Requirements: 3.5, 4.6, 5.6, 6.6_

  - [x] 3.2 Implement `OpenBankingClient` service
    - Create `src/main/java/com/dyl/openbanking_mcp/client/OpenBankingClient.java` annotated with `@Service`
    - Inject `TokenService`, `OpenBankingProperties`
    - Build `java.net.http.HttpClient` with configured connect timeout
    - Implement `String get(String path)` and `String get(String path, Map<String, String> queryParams)` methods
    - Before each request: call `tokenService.getToken()` with 5-second timeout via `CompletableFuture`
    - Set headers: `Authorization: Bearer <token>`, `Accept: application/json`, `x-fapi-interaction-id: <UUID v4>`
    - Send GET request with configured request timeout
    - On HTTP 200: return response body (include `x-fapi-interaction-id` from response if present)
    - On non-2xx: return structured error string with status code and body
    - On timeout/connectivity failure: throw `OpenBankingClientException`
    - If token is null/blank: throw exception before making HTTP call
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2, 9.3, 9.4_

  - [x] 3.3 Write property test: Base URL trailing slash normalisation (Property 1)
    - **Property 1: Base URL trailing slash normalisation**
    - **Validates: Requirements 1.3**
    - Create property test in `src/test/java/com/dyl/openbanking_mcp/config/OpenBankingPropertiesTests.java`
    - For any valid HTTPS URL with arbitrary trailing slashes, verify normalised URL does not end with `/`

  - [x] 3.4 Write property test: Bearer token header formatting (Property 2)
    - **Property 2: Bearer token header formatting**
    - **Validates: Requirements 2.2, 9.3**
    - Create property test in `src/test/java/com/dyl/openbanking_mcp/client/OpenBankingClientTests.java`
    - For any non-blank token string, verify the Authorization header is exactly `"Bearer " + token`

  - [x] 3.5 Write property test: Blank or null token rejection (Property 3)
    - **Property 3: Blank or null token rejection**
    - **Validates: Requirements 2.3**
    - Add property test in `src/test/java/com/dyl/openbanking_mcp/client/OpenBankingClientTests.java`
    - For any null or whitespace-only token, verify error response returned and no HTTP request sent

  - [x] 3.6 Write property test: Unique x-fapi-interaction-id per request (Property 8)
    - **Property 8: Unique x-fapi-interaction-id per request**
    - **Validates: Requirements 9.1**
    - Add property test in `src/test/java/com/dyl/openbanking_mcp/client/OpenBankingClientTests.java`
    - For any sequence of N requests (N ≥ 2), verify all `x-fapi-interaction-id` values are valid UUID v4 and distinct

- [x] 4. Checkpoint - Ensure configuration and client layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement MCP tool classes
  - [x] 5.1 Implement `AccountTools` with `list_accounts` and `get_account` tools
    - Create `src/main/java/com/dyl/openbanking_mcp/tools/AccountTools.java` as `@Component`
    - Implement `listAccounts()` annotated with `@McpTool(name = "list_accounts", ...)`
    - Implement `getAccount(String accountId)` annotated with `@McpTool(name = "get_account", ...)`
    - Validate `accountId`: non-blank, 1-40 characters; return error message if invalid
    - Delegate to `OpenBankingClient.get(path)` with try-catch for exceptions
    - Return error message strings on failure (never throw from tool methods)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Implement `BalanceTools` with `get_balances` tool
    - Create `src/main/java/com/dyl/openbanking_mcp/tools/BalanceTools.java` as `@Component`
    - Implement `getBalances(String accountId)` annotated with `@McpTool(name = "get_balances", ...)`
    - Validate `accountId`: non-blank, 1-40 characters; return error message if invalid
    - Delegate to `OpenBankingClient.get("/accounts/{accountId}/balances")`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 5.3 Implement `ProductTools` with `get_product` tool
    - Create `src/main/java/com/dyl/openbanking_mcp/tools/ProductTools.java` as `@Component`
    - Implement `getProduct(String accountId)` annotated with `@McpTool(name = "get_product", ...)`
    - Validate `accountId`: non-blank, 1-40 characters; return error message if invalid
    - Delegate to `OpenBankingClient.get("/accounts/{accountId}/product")`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.4 Implement `TransactionTools` with `get_transactions` tool
    - Create `src/main/java/com/dyl/openbanking_mcp/tools/TransactionTools.java` as `@Component`
    - Implement `getTransactions(String accountId, String fromBookingDateTime, String toBookingDateTime)` annotated with `@McpTool(name = "get_transactions", ...)`
    - Validate `accountId`: non-blank, 1-40 characters; return error message if invalid
    - Validate optional date parameters: if provided, must be valid ISO 8601 date-time; return error if invalid
    - Build query params map from valid date parameters
    - Delegate to `OpenBankingClient.get(path, queryParams)`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 5.5 Write property test: AccountId input validation (Property 6)
    - **Property 6: AccountId input validation**
    - **Validates: Requirements 4.5, 5.5, 6.5, 7.7**
    - Create property test in `src/test/java/com/dyl/openbanking_mcp/tools/AccountToolsTests.java`
    - For any null, empty, or whitespace-only accountId, verify all account-specific tools return error and make no HTTP call

  - [x] 5.6 Write property test: Date-time parameter validation and inclusion (Property 7)
    - **Property 7: Date-time parameter validation and inclusion**
    - **Validates: Requirements 7.3, 7.4, 7.8**
    - Create property test in `src/test/java/com/dyl/openbanking_mcp/tools/TransactionToolsTests.java`
    - For any invalid ISO 8601 string, verify error returned; for valid ISO 8601 strings, verify they are included as query parameters

  - [x] 5.7 Write property test: Successful response pass-through (Property 4)
    - **Property 4: Successful response pass-through**
    - **Validates: Requirements 3.3, 4.3, 5.3, 6.3, 7.5**
    - Add property test in `src/test/java/com/dyl/openbanking_mcp/tools/AccountToolsTests.java`
    - For any HTTP 200 response with a JSON body, verify the tool returns the complete unmodified body

  - [x] 5.8 Write property test: Error response formatting (Property 5)
    - **Property 5: Error response formatting**
    - **Validates: Requirements 3.4, 4.4, 5.4, 6.4, 7.6**
    - Add property test in `src/test/java/com/dyl/openbanking_mcp/tools/AccountToolsTests.java`
    - For any non-2xx status code, verify the tool returns a string containing the numeric status code and error details

  - [x] 5.9 Write property test: Response interaction ID propagation (Property 9)
    - **Property 9: Response interaction ID propagation**
    - **Validates: Requirements 9.4**
    - Add property test in `src/test/java/com/dyl/openbanking_mcp/client/OpenBankingClientTests.java`
    - For any response containing an `x-fapi-interaction-id` header, verify the returned result contains that value

- [x] 6. Checkpoint - Ensure all tool and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integration wiring and final validation
  - [x] 7.1 Wire MCP server configuration and verify tool registration
    - Ensure `@EnableConfigurationProperties(OpenBankingProperties.class)` is on the application class
    - Verify all 5 tools are discoverable by the MCP framework at startup
    - Confirm stdio transport is active and no network ports are opened
    - _Requirements: 8.1, 8.2, 8.3, 10.1, 10.2_

  - [x] 7.2 Write integration tests for tool discovery and startup
    - Create `src/test/java/com/dyl/openbanking_mcp/integration/McpServerIntegrationTests.java`
    - Test that Spring context loads with valid configuration
    - Test that all 5 tools are registered and discoverable
    - Test that invalid configuration (missing base-url) prevents context from loading
    - _Requirements: 8.1, 8.3, 1.2, 1.4_

  - [x] 7.3 Write unit tests for tool methods
    - Add example-based unit tests in `src/test/java/com/dyl/openbanking_mcp/tools/` for each tool class
    - Test specific edge cases: AccountId exactly 40 chars, AccountId with special characters, empty response body
    - Test token exception handling paths
    - _Requirements: 2.4, 4.5, 5.5, 6.5, 7.7_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `DefaultTokenService` is a placeholder — real OAuth2 implementation is deferred
- All tool methods return String (never throw) to ensure AI clients always get a usable response
- The `logback-spring.xml` is critical to avoid corrupting MCP protocol messages on stdout

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5", "3.6"] },
    { "id": 5, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 6, "tasks": ["5.5", "5.6", "5.7", "5.8", "5.9"] },
    { "id": 7, "tasks": ["7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3"] }
  ]
}
```
