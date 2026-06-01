# Tech Stack

## Language & Runtime
- Java 21
- Spring Boot 4.0.6
- Spring AI 2.0.0-M7 (MCP Server starter)

## Build System
- Maven (wrapper included, v3.9.16)
- Use `mvnw.cmd` on Windows, `./mvnw` on Unix

## Key Dependencies
- `spring-ai-starter-mcp-server` — MCP server framework for exposing tools to AI clients
- `spring-boot-starter-test` — testing (JUnit 5, Spring Test)

## Common Commands

```shell
# Build the project
mvnw.cmd clean package

# Run tests
mvnw.cmd test

# Run the application
mvnw.cmd spring-boot:run

# Skip tests during build
mvnw.cmd clean package -DskipTests
```

## Configuration
- Application config: `src/main/resources/application.yaml`
- OpenBanking API spec: `src/main/resources/openbanking-spec.json`

## Notes
- Spring AI MCP Server communicates over stdio by default. Tools are registered as Spring beans annotated for MCP exposure.
- The project uses Spring Boot's dependency management via the `spring-ai-bom` for consistent Spring AI versioning.
