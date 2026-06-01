# Project Structure

```
openbanking-mcp/
├── .kiro/steering/          # AI steering rules
├── src/
│   ├── main/
│   │   ├── java/com/dyl/openbanking_mcp/
│   │   │   └── OpenbankingMcpApplication.java   # Spring Boot entry point
│   │   └── resources/
│   │       ├── application.yaml                 # App configuration
│   │       └── openbanking-spec.json            # UK Open Banking API spec (v4.0.1)
│   └── test/
│       └── java/com/dyl/openbanking_mcp/
│           └── OpenbankingMcpApplicationTests.java
├── pom.xml                  # Maven build config
├── mvnw / mvnw.cmd          # Maven wrapper scripts
└── README.md
```

## Package Convention
- Base package: `com.dyl.openbanking_mcp`
- Group ID: `com.dyl`
- Artifact ID: `openbanking-mcp`

## Architecture Patterns
- Standard Spring Boot layered architecture
- MCP tools exposed as Spring-managed beans
- OpenAPI spec bundled as a resource for reference or runtime use

## Conventions
- Java source uses tabs for indentation (Spring Initializr default)
- Test classes use the `*Tests` suffix (e.g., `OpenbankingMcpApplicationTests`)
- Tests use JUnit 5 with `@SpringBootTest` for integration tests
- Configuration in YAML format (not properties)
