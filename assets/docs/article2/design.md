# Design Document: Open Banking MCP Tools

## Overview

This design describes the architecture for an MCP (Model Context Protocol) server that exposes UK Open Banking Account and Transaction API v4.0.1 operations as tools for AI assistants. The server is built on Spring Boot 4.0.6 with Spring AI 2.0.0-M7 MCP Server starter, communicating exclusively over stdio transport.

The server provides five MCP tools (`list_accounts`, `get_account`, `get_balances`, `get_product`, `get_transactions`) that proxy requests to an external Open Banking API (ASPSP). Authentication is handled by a dedicated token service, and the API base URL is externally configurable.

**Key design decisions:**
- Use Spring AI `@McpTool` / `@McpToolParam` annotations for declarative tool registration
- Use Java's built-in `java.net.http.HttpClient` (available since Java 11) for HTTP calls — avoids adding WebClient/RestClient dependencies
- Centralise HTTP concerns (headers, auth, timeouts, error handling) in a single client service
- Validate inputs at the tool layer before delegating to the HTTP client
- Token retrieval is abstracted behind an interface so implementations can be swapped

## Architecture

```mermaid
graph TD
    AI[AI Client / LLM Host] -->|stdio| MCP[MCP Server<br/>Spring Boot App]
    MCP --> TL[Tool Layer<br/>@McpTool beans]
    TL --> HC[OpenBankingClient<br/>HTTP Client Service]
    HC --> TS[TokenService<br/>Interface]
    HC -->|HTTPS + FAPI headers| OB[Open Banking API<br/>ASPSP]
    
    subgraph Spring Context
        TL
        HC
        TS
        CFG[OpenBankingProperties<br/>@ConfigurationProperties]
    end
```

**Data flow for a tool invocation:**
1. AI client sends a tool call over stdio (e.g., `get_balances` with `accountId`)
2. Spring AI MCP framework deserialises the request and invokes the annotated `@McpTool` method
3. The tool method validates input parameters
4. The tool delegates to `OpenBankingClient`, which:
   a. Retrieves a Bearer token from `TokenService`
   b. Constructs the HTTP request with required headers (Authorization, x-fapi-interaction-id, Accept)
   c. Sends the request to `{base-url}/{path}`
   d. Returns the response body or an error description
5. The tool returns the result string to the MCP framework, which serialises it back over stdio

## Components and Interfaces

### Package Structure

```
com.dyl.openbanking_mcp/
├── OpenbankingMcpApplication.java          # Spring Boot entry point
├── config/
│   └── OpenBankingProperties.java          # @ConfigurationProperties for openbanking.*
├── client/
│   ├── OpenBankingClient.java              # HTTP client service (sends requests to ASPSP)
│   └── OpenBankingClientException.java     # Custom exception for API/connectivity errors
├── token/
│   ├── TokenService.java                   # Interface for Bearer token retrieval
│   └── DefaultTokenService.java            # Placeholder implementation (returns stub token)
└── tools/
    ├── AccountTools.java                   # @McpTool methods: list_accounts, get_account
    ├── BalanceTools.java                   # @McpTool method: get_balances
    ├── ProductTools.java                   # @McpTool method: get_product
    └── TransactionTools.java              # @McpTool method: get_transactions
```

### Component Details

#### `OpenBankingProperties`

```java
@ConfigurationProperties(prefix = "openbanking.api")
@Validated
public class OpenBankingProperties {
    @NotBlank(message = "openbanking.api.base-url is required")
    @Pattern(regexp = "^https://.*", message = "openbanking.api.base-url must be a valid HTTPS URL")
    private String baseUrl;

    // Connection timeout in seconds (default 30)
    private int connectTimeout = 30;
    // Request timeout in seconds (default 30)
    private int requestTimeout = 30;
}
```

- Strips trailing slash from `baseUrl` via a `@PostConstruct` normalisation method
- Validation failures prevent application startup with descriptive error messages

#### `TokenService` (Interface)

```java
public interface TokenService {
    /**
     * Retrieves a valid Bearer token for Open Banking API requests.
     * @return non-blank Bearer token string
     * @throws TokenRetrievalException if the token cannot be obtained
     */
    String getToken();
}
```

- Implementations may cache tokens, call OAuth2 endpoints, etc.
- `DefaultTokenService` is a placeholder `@Component` that throws `UnsupportedOperationException` (to be replaced with a real implementation)

#### `OpenBankingClient`

```java
@Service
public class OpenBankingClient {
    private final HttpClient httpClient;
    private final TokenService tokenService;
    private final OpenBankingProperties properties;

    public String get(String path) { ... }
    public String get(String path, Map<String, String> queryParams) { ... }
}
```

Responsibilities:
- Builds `java.net.http.HttpClient` with configured connect timeout
- Before each request: calls `tokenService.getToken()` (with 5-second timeout enforcement)
- Sets headers: `Authorization: Bearer <token>`, `Accept: application/json`, `x-fapi-interaction-id: <UUID v4>`
- Sends GET request with configured request timeout (30s default)
- On success (HTTP 200): returns response body as-is (JSON string)
- On non-2xx: returns structured error string including status code and response body
- On timeout/connectivity failure: throws `OpenBankingClientException`
- If response includes `x-fapi-interaction-id` header, appends it to the returned result metadata

#### Tool Classes

Each tool class is a `@Component` with `@McpTool`-annotated methods:

```java
@Component
public class AccountTools {

    @McpTool(name = "list_accounts", description = "Retrieve all PSU accounts from the Open Banking API")
    public String listAccounts() { ... }

    @McpTool(name = "get_account", description = "Retrieve details for a specific account by AccountId")
    public String getAccount(
        @McpToolParam(description = "Account identifier (1-40 characters)", required = true)
        String accountId) { ... }
}
```

**Input validation pattern** (applied in each tool method):
1. Check parameter constraints (non-blank, length 1-40, valid ISO 8601 for dates)
2. If invalid, return error message string immediately (no HTTP call)
3. If valid, delegate to `OpenBankingClient.get(path)` wrapped in try-catch
4. Catch `OpenBankingClientException` → return connectivity error message
5. Catch token-related exceptions → return authentication error message

### MCP Tool Registration

Spring AI auto-configuration handles registration:
- `spring.ai.mcp.server.stdio=true` enables stdio transport
- `spring.ai.mcp.server.type=SYNC` for synchronous tool execution
- The annotation scanner detects all `@McpTool` methods in `@Component` beans
- Tools are automatically discoverable by AI clients upon connection

### Configuration (application.yaml)

```yaml
spring:
  application:
    name: openbanking-mcp
  ai:
    mcp:
      server:
        stdio: true
        type: SYNC
        name: openbanking-mcp
        version: 1.0.0
  main:
    banner-mode: off

openbanking:
  api:
    base-url: ${OPENBANKING_API_BASE_URL}
    connect-timeout: 30
    request-timeout: 30

logging:
  pattern:
    console: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"
```

**Logging to stderr:** Spring Boot's default console appender writes to `System.out`. Since MCP uses stdout for protocol messages, the application must redirect logging to stderr. This is achieved by configuring the logging system to write to `System.err` (via a custom `logback-spring.xml` or programmatic redirect at startup).

## Data Models

The server does not define its own domain model classes for Open Banking responses. Instead, it passes through the JSON response body as a raw string. This keeps the implementation simple and avoids schema drift when the ASPSP returns fields beyond the spec.

**Key schemas referenced (from the bundled OpenAPI spec):**

| Tool | Success Response Schema | Description |
|------|------------------------|-------------|
| `list_accounts` | OBReadAccount6 | `Data.Account[]` array of account objects |
| `get_account` | OBReadAccount6 | Single account in `Data.Account[]` |
| `get_balances` | OBReadBalance1 | `Data.Balance[]` array of balance objects |
| `get_product` | OBReadProduct2 | `Data.Product[]` array of product objects |
| `get_transactions` | OBReadTransaction6 | `Data.Transaction[]` array of transaction objects |

**Error response schema:** `OBErrorResponse1` — contains `Code`, `Message`, and `Errors[]` array.

**Input parameter constraints:**

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `accountId` | String | Required, 1-40 characters, non-blank |
| `fromBookingDateTime` | String | Optional, ISO 8601 date-time format |
| `toBookingDateTime` | String | Optional, ISO 8601 date-time format |


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Base URL trailing slash normalisation

*For any* valid HTTPS URL string configured as `openbanking.api.base-url`, the normalised base URL used as a request prefix SHALL NOT end with a `/` character, regardless of how many trailing slashes the original value contained.

**Validates: Requirements 1.3**

### Property 2: Bearer token header formatting

*For any* non-blank token string returned by the TokenService, the HTTP request to the Open Banking API SHALL contain an `Authorization` header with the exact value `"Bearer " + token` (single space separator, no trailing whitespace).

**Validates: Requirements 2.2, 9.3**

### Property 3: Blank or null token rejection

*For any* token value that is null or composed entirely of whitespace characters, the tool SHALL return an error response indicating authentication is unavailable and SHALL NOT send any HTTP request to the Open Banking API.

**Validates: Requirements 2.3**

### Property 4: Successful response pass-through

*For any* tool invocation where the Open Banking API returns HTTP 200 with a JSON response body, the tool SHALL return a result string that contains the complete, unmodified response body.

**Validates: Requirements 3.3, 4.3, 5.3, 6.3, 7.5**

### Property 5: Error response formatting

*For any* tool invocation where the Open Banking API returns a non-2xx HTTP status code, the tool SHALL return an error message string that contains both the numeric HTTP status code and the error details from the response body.

**Validates: Requirements 3.4, 4.4, 5.4, 6.4, 7.6**

### Property 6: AccountId input validation

*For any* string that is null, empty, or composed entirely of whitespace, when provided as the `accountId` parameter to any account-specific tool (`get_account`, `get_balances`, `get_product`, `get_transactions`), the tool SHALL return an error message indicating that AccountId is required and SHALL NOT send any HTTP request.

**Validates: Requirements 4.5, 5.5, 6.5, 7.7**

### Property 7: Date-time parameter validation and inclusion

*For any* string that is not a valid ISO 8601 date-time, when provided as `fromBookingDateTime` or `toBookingDateTime` to the `get_transactions` tool, the tool SHALL return an error message indicating invalid date format. Conversely, *for any* valid ISO 8601 date-time string provided as these parameters, the HTTP request SHALL include them as query parameters with their original values.

**Validates: Requirements 7.3, 7.4, 7.8**

### Property 8: Unique x-fapi-interaction-id per request

*For any* sequence of N HTTP requests sent by the OpenBankingClient (where N ≥ 2), every `x-fapi-interaction-id` header value SHALL be a valid RFC 4122 UUID v4 string, and all N values SHALL be distinct from each other.

**Validates: Requirements 9.1**

### Property 9: Response interaction ID propagation

*For any* HTTP response from the Open Banking API that includes an `x-fapi-interaction-id` header, the tool result returned to the MCP caller SHALL contain that header's value.

**Validates: Requirements 9.4**

## Error Handling

### Error Categories and Responses

| Category | Trigger | Tool Response |
|----------|---------|---------------|
| **Configuration Error** | Missing/invalid `openbanking.api.base-url` | Application fails to start with descriptive validation error |
| **Authentication Error** | TokenService returns null/blank or throws exception | `"Error: Authentication unavailable - unable to obtain access token"` |
| **Validation Error** | Invalid input parameters (blank AccountId, bad date format) | `"Error: {parameter} is required and must be {constraint}"` |
| **API Error** | Open Banking API returns non-2xx | `"Error: HTTP {statusCode} - {errorBody}"` |
| **Connectivity Error** | Connection timeout or network failure | `"Error: Unable to connect to Open Banking API - connection timed out after 30 seconds"` |
| **Unexpected Error** | Any other runtime exception | `"Error: An unexpected error occurred - {exception.message}"` |

### Error Handling Strategy

1. **Fail-fast on configuration:** Use `@Validated` on `@ConfigurationProperties` so Spring refuses to start with invalid config. This surfaces problems at deploy time, not at runtime.

2. **Validate before calling:** Each tool validates its inputs before delegating to the HTTP client. This avoids unnecessary network calls and provides immediate, clear feedback.

3. **Never throw from tools:** MCP tool methods always return a String. Errors are returned as descriptive error message strings rather than thrown exceptions. This ensures the AI client always receives a usable response.

4. **Structured error messages:** Error messages follow a consistent format: `"Error: {category} - {details}"`. This makes them parseable by AI clients.

5. **Token timeout:** TokenService calls are bounded to 5 seconds using `CompletableFuture.get(5, TimeUnit.SECONDS)` to prevent indefinite blocking.

6. **HTTP timeout:** The `java.net.http.HttpClient` is configured with a 30-second connect timeout and 30-second request timeout via `HttpRequest.Builder.timeout()`.

7. **Logging:** All errors are logged at WARN or ERROR level to stderr for operational visibility, while the tool returns a user-friendly message.

## Testing Strategy

### Testing Approach

The project uses a dual testing approach:
- **Property-based tests** (via [jqwik](https://jqwik.net/)) for universal properties that should hold across all valid inputs
- **Unit tests** (JUnit 5) for specific examples, edge cases, and integration points

### Property-Based Testing

**Library:** jqwik 1.9.x (JUnit 5 compatible, runs within the standard Maven Surefire plugin)

**Configuration:**
- Minimum 100 iterations per property test (jqwik default is 1000, which exceeds our minimum)
- Each property test is tagged with a comment referencing the design property
- Tag format: `// Feature: openbanking-mcp-tools, Property {number}: {property_text}`

**Properties to implement:**
1. Base URL normalisation (strip trailing slashes)
2. Bearer token header formatting
3. Blank/null token rejection (no HTTP call made)
4. 200 response pass-through (body returned unchanged)
5. Non-2xx error formatting (contains status code + body)
6. AccountId validation (blank/null rejected, no HTTP call)
7. Date-time validation and query parameter inclusion
8. Unique x-fapi-interaction-id per request
9. Response interaction ID propagation

### Unit Tests (Example-Based)

| Test Area | Examples |
|-----------|----------|
| Configuration validation | Absent property, empty, http:// URL, valid https:// URL |
| TokenService exception handling | RuntimeException, TimeoutException |
| Tool registration | All 5 tools discoverable |
| Accept header | Always "application/json" |
| Stdin close → graceful shutdown | Close stdin, verify exit within 5s |
| Logging to stderr | Verify no log output on stdout |

### Integration Tests

| Test | Description |
|------|-------------|
| Full tool invocation | Mock HTTP server, invoke tool end-to-end via Spring context |
| MCP tool discovery | Connect MCP client, verify all tools listed with schemas |
| Startup failure | Invalid config → context fails to load |

### Test Dependencies (to add to pom.xml)

```xml
<dependency>
    <groupId>net.jqwik</groupId>
    <artifactId>jqwik</artifactId>
    <version>1.9.2</version>
    <scope>test</scope>
</dependency>
```

### Test Package Structure

```
src/test/java/com/dyl/openbanking_mcp/
├── OpenbankingMcpApplicationTests.java     # Context loads test
├── config/
│   └── OpenBankingPropertiesTests.java     # Config validation tests
├── client/
│   └── OpenBankingClientTests.java         # HTTP client property + unit tests
├── tools/
│   ├── AccountToolsTests.java             # Account tool tests
│   ├── BalanceToolsTests.java             # Balance tool tests
│   ├── ProductToolsTests.java            # Product tool tests
│   └── TransactionToolsTests.java         # Transaction tool tests (incl. date validation)
└── token/
    └── TokenServiceTests.java             # Token retrieval tests
```
