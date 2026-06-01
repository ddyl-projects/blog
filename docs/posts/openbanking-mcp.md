---
title: "Connecting Agentic AI to a bank account"
date: "2026-06-01"
author: "Damian Dyl"
description: "I have used Kiro to develop Open Banking MCP Server. Next I have connected AI Agent to sandbox bank account via Open Banking."
tags:
  - mcp
  - openbanking
  - kiro
  - java
  - spring-ai
---

<div class="styled-table">

# Context & Overview

In my day-to-day life, I am the Technical Lead for Open Banking - Account Information Services (AIS) Project. Your first question might be: what exactly is Open Banking? Well, I am glad you asked!

Imagine a typical customer interacting with their bank. They need some sort of interface—whether that is walking into a branch to talk to a teller, logging onto a website, or opening a mobile application.

But what if a computer wants to interact with a bank? For instance, think of a third-party application that needs to access your banking data on your behalf, like a mobile card wallet or an app that aggregates all your different bank accounts into a single dashboard.

This is where Open Banking comes into play. It is a UK-wide initiative requiring every major bank to expose banking data to authorized third parties via a set of common web interfaces (APIs). These interfaces return raw banking data that can be analyzed or displayed, but the data is only shared once the customer explicitly provides their consent.

At this point, you might be thinking, "Okay, that’s cool background context, but where are you going with this?" Well, for a while now, I have been wondering: what would happen if we connected an AI agent directly to a bank account to see what kind of financial insights it could generate? I could have just exported my data and fed it into an AI manually, but that would be tedious—and frankly, it wouldn't make for a very interesting blog post!

Instead, I wondered if I could teach an AI to "talk" to a bank and fetch the data itself. This is where a second concept comes into play: the Model Context Protocol (MCP). MCP allows developers to create a standardized server that an AI can use to interact with external services. When an AI first connects to an MCP server, it asks what operations are available. The MCP server then returns the available operations, their required request parameters, and descriptions of what they do, giving the AI the exact context it needs to safely interact with the system.

I realized that if I could build an Open Banking MCP server, I could train an AI agent to communicate directly with a bank sandbox via Open Banking APIs, pull real financial data alongside its schema descriptions, and then see what the AI could actually do with it.

This article is divided into three sections. In the first section, I will unpack the technical details of how I used Kiro to implement the MCP server and the engineering hurdles I encountered along the way. In the second section, I will showcase the actual interactions with my brand-new personal AI financial advisor! In the final section, I’ll break down my experience evaluating Agentic AI as a financial advisor, share how I leveraged spec-driven development to build an MCP server, and wrap up with my predictions on how AI agents will transform the future of financial services.

![Articles dont render correctly](assets/images/article2/basic-flow.png)

# Setting the Ground Rules 
First things first: I am using this AI without any corporate guardrails. While Kiro Pro does not use my data or conversations to train its models, I still wouldn't feel comfortable deploying this setup into a live production environment without implementing rigorous enterprise-grade guardrails first.

The second challenge is regulatory. In order to consume real-world Open Banking APIs in the UK, you must be registered with an authorized financial institution, such as the Financial Conduct Authority (FCA). I highly doubt they would grant me a regulatory license solely for the purpose of writing this blog post!

Finally, production Open Banking APIs rely heavily on complex authentication and authorization flows utilizing OAuth2 and mutual TLS, which require significant infrastructure overhead to integrate.

With all that in mind, I decided the best and safest approach was to leverage one of the official Open Banking Sandbox environments, which are freely available for developers to test integrations. I also chose to dramatically simplify the authentication and authorization process so I could focus entirely on the banking data itself.


**_Disclamer: This Agentic AI operates entirely within a simulated sandbox and does not connect to live banking environments or real-world financial systems. All data used in this experiment was AI-generated and does not represent real individuals or actual spending habits._**

# Building the Server with Kiro

I started my journey by doing some quick research on how to spin up an MCP server. Since I am most comfortable working in Java, I checked to see what options were available in that ecosystem. Luckily for me, the Spring framework features a spring-ai-starter-mcp-server dependency. It provides a complete framework for bootstrapping an MCP server, allowing you to focus entirely on your core business logic.

I used Spring Initializr to generate a skeleton Spring Boot project using Maven for dependency management, pulling in that core Spring AI MCP dependency. I downloaded the project ZIP file and imported it directly into Kiro.

Next, I went to the official Open Banking GitHub repository and downloaded the Accounts and Transactions Read-Only OpenAPI specification, which I added to the project resources. By default, Open Banking includes dozens of endpoints. For this experiment, I trimmed the specification down to support only core account information, products, balances, and transactions—removing ancillary endpoints like standing orders and direct debits. I knew I would need this clean file later!

I then instructed Kiro to analyze the codebase and generate its project steering files. These steering files act as a compass for Kiro, documenting the project structure, language conventions, and primary frameworks. It immediately and successfully recognized the core purpose of the project:

> **Product Overview**
> * Open Banking MCP Server — an MCP (Model Context Protocol) server that exposes UK
> * Open Banking Account and Transaction API operations as tools for AI assistants.

Product overview can be found [here](assets/docs/article2/product.md)

It also correctly mapped out our architecture:

> **Architecture Patterns**
> * Standard Spring Boot layered architecture
> * MCP tools exposed as Spring-managed beans
> * OpenAPI spec bundled as a resource for reference or runtime use

The structure file can be found [here](assets/docs/article2/structure.md)

Finally, it cataloged the core technical specifications:

> **Language & Runtime**
> * Java 21
> * Spring Boot 4.0.6
> * Spring AI 2.0.0-M7 (MCP Server starter)
>
> **Build System**
> * Maven (wrapper included, v3.9.16)
> * Use `mvnw.cmd` on Windows, `./mvnw` on Unix
>
> **Key Dependencies**
> * `spring-ai-starter-mcp-server` — MCP server framework for exposing tools to AI clients
> * spring-boot-starter-test` — testing (JUnit 5, Spring Test)

The technology overview can be found [here](assets/docs/article2/tech.md)

With the baseline set, I prompted Kiro to build out the functional MCP service using our specification file:

> * Develop openbanking mcp server, using openbanking specification stored in the resources folder. 
> * The authentication token required to send requests to open banking will be provided by springboot service class. 
> * We will implement the token obtaining functionality later.
> * Also add an option to configure an open banking apis url.
> * The server will use Standard Input Output Communication for MCP.

That single prompt communicated a few critical constraints to the AI. First, it established that we were building an out-of-the-box MCP server driven directly by the attached OpenAPI specification file. Second, it told the AI not to worry about OAuth2 handshakes for now; the required access token would simply be injected into the server class.

Finally, it specified that the server should utilize Standard Input/Output (STDIO) communication. 
Kiro immediately digested my prompt and generated a clean list of requirements, providing me with the following summary:

> The requirements document is ready. It covers 10 requirements for the Open Banking MCP server:
> 
> * Configurable API Base URL — HTTPS-only, fail-fast validation
> * Authentication Token Integration — Token_Service contract with graceful error handling
> * List Accounts Tool — GET /accounts, no parameters
> * Get Account Details Tool — GET /accounts/{AccountId} with input validation
> * Get Account Balances Tool — GET /accounts/{AccountId}/balances
> * Get Account Product Tool — GET /accounts/{AccountId}/product
> * Get Account Transactions Tool — GET /accounts/{AccountId}/transactions with optional date filters
> * MCP Tool Registration — Spring bean auto-registration over stdio
> * HTTP Request Headers — FAPI compliance headers
> * STDIO Communication

The scope was perfectly captured. From there, we moved into generating the internal software design files, and ultimately, a sequence of granular implementation tasks was created and executed by the AI. (If you want to read more about how this specification-driven development workflow operates with Kiro, check out my first blog post where I break down the entire process step-by-step).

Requirements can be found [here](assets/docs/article2/requirements.md)

Design overview can be found [here](assets/docs/article2/design.md)

All tasks can be are documented [here](assets/docs/article2/tasks.md)


## STDIO MCP Explained
Before jumping into implementation I wanted to explain STDIO MCP. STDIO means that instead of hosting an external web server where agents must authenticate over HTTP, the MCP server is launched as a subprocess directly inside the Kiro IDE, and the IDE communicates with it natively via standard input/output streams. Every time a computer operating system (like Windows, macOS, or Linux) starts a process, it automatically hooks up three data streams to it:

* STDIN (Standard Input) - How the process receives data.
* STDOUT (Standard Output) - How the process sends data out.
* STDERR (Standard Error) - Where the process sends logs and error messages.

The communication between parent and child process uses JSON-RPC, a lightweight, stateless remote procedure call protocol, which utilizes JSON message format. In MCP STDIO Mode, the host application (like Kiro IDE) spawns the MCP Server as a child process. The Host then writes JSON-RPC strings directly into the server's stdin, and listens for replies on the server's stdout.  It is a highly streamlined communication model that worked perfectly for this proof of concept.

You might ask Why not host MCP as a local web server like localhost:8080? There are few advantages to STDIO for local AI tools:

* Security through isolation - A STDIO Child Process is invisible to the network and outside attackers. Only the parent process that created it can talk to it.
* No Port Management - If you run multiple MCP servers (one for Github, one for Jira, one for Open Banking), you don't have to worry about port conflicts.
* Automatic Lifecycle Management - When you close your Agentic AI Client Application, the operating system will automatically kill child processess attached to it. This will include your MCP Servers and you won't need to manually switch them off.
* Simplicity - There is no TCP handshake network overhead, no CORS issues, and no firewall configuration. Writing to stdin is esentially writing straight to local memory making it incredibly fast.

![Articles dont render correctly](assets/images/article2/stdio.png)

## Refining the AI's Output Schema
Once the agent completed the initial implementation, I pulled up the code for a manual review.

The architecture was straightforward: there was a lightweight Open Banking client responsible for dispatching HTTP requests to the sandbox APIs: and a series of dedicated MCP Tool classes mapping to each specific banking operation (accounts, balances, products, and transactions).

![Articles dont render correctly](assets/images/article2/mcp.png)

Open Banking Client:

```java
	/**
	 * Sends a GET request to the specified path with optional query parameters.
	 *
	 * @param path        the API path (e.g., "/accounts/{id}/transactions")
	 * @param queryParams optional query parameters to append to the URL
	 * @return the response body on success, or a structured error string on non-2xx responses
	 * @throws OpenBankingClientException if the token is unavailable or a connectivity failure occurs
	 */
	public String get(String path, Map<String, String> queryParams) {
		logger.info("Calling path: {} with query params: {}", path, queryParams);
		String token = retrieveToken();

		if (token == null || token.isBlank()) {
			throw new OpenBankingClientException(
					"Authentication unavailable - unable to obtain access token");
		}

		String url = buildUrl(path, queryParams);
		String interactionId = UUID.randomUUID().toString();

		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(url))
				.timeout(Duration.ofSeconds(properties.getRequestTimeout()))
				.header("Authorization", "Bearer " + token)
				.header("Accept", "application/json")
				.header("x-fapi-interaction-id", interactionId)
				.GET()
				.build();

		logger.debug("Sending GET request to {} with x-fapi-interaction-id: {}", url, interactionId);

		try {
			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			return handleResponse(response);
		}
```

Whenever the AI agent connects to our MCP server, it is presented with available tools. The tools use descriptive metadata annotations to explain what the endpoint does and how the request must be structured, helping the LLM understand exactly how to compose valid queries:

```java
	/**
	 * Retrieves details for a specific account by AccountId.
	 *
	 * @param accountId the account identifier (1-40 characters)
	 * @return {@link OBReadAccount6} containing account data, links, and metadata
	 */
	@McpTool(name = "get_account", description = "Retrieve details for a specific account by AccountId")
	public OBReadAccount6 getAccount(
			@McpToolParam(description = "Account identifier (1-40 characters)", required = true)
			String accountId) {
		if (accountId == null || accountId.isBlank() || accountId.length() > 40) {
			throw new McpToolError("accountId is required and must be between 1 and 40 characters");
		}

		try {
			String response = openBankingClient.get("/accounts/" + accountId);
			String json = extractJsonBody(response);
			return objectMapper.readValue(json, OBReadAccount6.class);
		} catch (OpenBankingClientException e) {
			throw new McpToolError(e.getMessage(), e);
		} catch (JsonProcessingException e) {
			throw new McpToolError("Failed to parse API response - " + e.getMessage(), e);
		} catch (RuntimeException e) {
			throw new McpToolError("An unexpected error occurred - " + e.getMessage(), e);
		}
	}
```

However, I noticed something interesting during my review: the default tool implementation simply returned a raw JSON string to the AI. I knew that while the AI could likely infer data types from the JSON keys, it would be significantly more robust if we provided the LLM with an explicit schema definition—especially for banking fields where names can be ambiguous.


```java
	@McpTool(name = "get_balances", description = "Retrieve balance information for a specific account by AccountId")
	public String getBalances(
			@McpToolParam(description = "Account identifier (1-40 characters)", required = true)
			String accountId)
```


I asked Kiro if we could improve this. Kiro suggested enabling generateOutputSchema = true on the tool definition. In Spring AI, this tells the framework to auto-generate a JSON schema from the return type, which is then used to validate runtime responses and pass rich structural context directly to the AI agent.

To do this properly, Kiro also noted that we needed to stop returning generic strings and instead map the API responses to concrete Java types.

I agreed and asked Kiro to generate the data models directly from our OpenAPI specification. Kiro generated the records quickly, but initially left out field descriptions—which defeated the whole purpose of the exercise. I pointed this out, and the AI rectified it instantly. Honestly, that remains one of my absolute favorite use cases for LLMs: knocking out hundreds of lines of tedious, repetitive documentation and POJO modeling in a matter of seconds.

Here is a snippet of the beautifully annotated model Kiro generated:


```java
public record Links(
    @JsonProperty("Self") @JsonPropertyDescription("Absolute URI to the current page of results") String self,
    @JsonProperty("First") @JsonPropertyDescription("Absolute URI to the first page of results") String first,
    @JsonProperty("Prev") @JsonPropertyDescription("Absolute URI to the previous page of results") String prev,
    @JsonProperty("Next") @JsonPropertyDescription("Absolute URI to the next page of results") String next,
    @JsonProperty("Last") @JsonPropertyDescription("Absolute URI to the last page of results") String last
) {}
```

## Simulating the Sandbox Data

With the code polished, I turned my attention back to the developer sandbox.

I downloaded the default sample data provided by the sandbox platform, but quickly ran into a snag: it only contained a tiny handful of mock records. That was never going to be enough data to let an AI's financial analysis capabilities truly shine! To fix this, I provided Kiro with the structure of the sandbox data and asked it to synthesize a comprehensive, realistic mock profile for me:

> * There should be one customer named Damian Dyl. 
> * The customer will have two banking accounts, one current with transactions and one saving account. 
> * Current account balance will be 2000 gbp, saving account will have 300 gbp.
> * There should be 400 transactions spread evenly across the last 4 months.
> * The transactions should be debit type and amounts should vary between 1 and 200 gbp.
> * The transaction values should be against popular UK retailers. They should also include things such as taxes, transport, entertainment and others.
> * There should be a monthly mortgage payment of £400
> * Bills should recur every month.
> * There should be a credit salary payment of £3500 every month.
> * Transactions should be chronological starting with the oldest.

After about six minutes of processing, Kiro updated me:

> Done. The new sample_data.yaml has been generated with:
>
> * Customer: Damian Dyl (private)
> * Account 1: Standard Current Account — £2,000 balance, 396 debit and 4 credit transactions over the last 120 days 
> * Account 2: Easy Access Saver — £300 balance, no transactions
> * The transactions cover realistic UK spending: Tesco, Sainsbury's, Aldi, Shell, BP, PureGym, Bristol City Council tax, British Gas, TfL, Nando's, Costa, Netflix, Spotify, Amazon, Deliveroo, and more — all chronological from the oldest transaction.

I took the generated YAML file and uploaded it directly into my developer sandbox.

## Authentication
Only one piece of the puzzle remained.

As I mentioned earlier, calling production Open Banking APIs requires navigating a massive compliance and security dance: registering with the FCA, onboarding with the Open Banking directory, configuring eIDAS certificates, initiating OAuth2 authorization flows, and securing explicit customer consent. Only at the very end of this chain do you receive an access token to attach to your API headers—and those tokens have a lifespan shorter than a mayfly.

![Articles dont render correctly](assets/images/article2/ob-auth.png)

Fortunately, this flow is drastically simplified in a sandbox environment. There are no transport certificates required, consents can be approved programmatically via a quick script, and the tokens do not expire.

To keep my focus strictly on the MCP integration, I opted for the simplest route possible. I knew I was only evaluating one mock customer and that my sandbox token wouldn't expire. Rather than writing an entire OAuth2 client inside my MCP server, I fired up a ready-made Postman collection provided by the sandbox, ran the auth scripts manually, and extracted a shiny, long-lived access token. I then configured my MCP server to inject this token directly into the HTTP client. (It goes without saying: this is strictly a local sandbox experiment; Open Banking has incredibly strict security policies regarding token handling in real applications!) 

My final directive to Kiro was to wire up this configurable property. Kiro completed it before I could even blink. 

## The reality check
I have completed the implementation. It was time to run the service and test it out. I was excited!

...Right up until I compiled the code and ran the application.

While the Kiro IDE hooked into my local MCP server perfectly, the actual communication broke down immediately.

Remember how I enabled generateOutputSchema = true so the AI would have rich data context? Well, that feature also strictly validates the incoming JSON responses against the generated schema before passing them along. In our sandbox environment, several optional API fields were left blank or null. Because the strict schema validation wasn't expecting missing data, the MCP server began throwing runtime validation exceptions and failing the requests.

My immediate, frustrated thought was: "Kiro, you literally read the OpenAPI spec! You knew these fields were optional, why didn't you build the models to handle this?"

When I asked Kiro to resolve the issue, it suggested marking the fields as @Nullable using Jackson annotations. It scanned the OpenAPI spec again, identified the optional parameters, and applied the changes. I recompiled, restarted the server, and tested it—only to hit the exact same exception. I asked Kiro again, and it suggested switching to Spring's @Nullable annotation instead. Same result.

Finally, Kiro suggested the nuclear option: just turn off generateOutputSchema to bypass the validation layer entirely. I really didn't want to do that because I wanted the model to benefit from the schema context. However, after doing some independent digging online, I discovered that this is a known edge-case bug in the current version of the framework — nullable fields and generateOutputSchema simply do not play nice together yet.

Accepting defeat, I had Kiro turn the property off. As a workaround, I had it implement a dedicated metadata tool endpoint that would dump the raw schemas as a string response if explicitly called. I figured if the AI ever got confused by a field, it could call that endpoint to orient itself (though during my subsequent testing, the agent never actually needed to trigger it).

# Could Kiro be my financial advisor?
**_Disclamer: All data used in this experiment was AI-generated and does not represent real individuals or actual spending habits._**

With the implementation completed, bugs squashed and server configured it was finally time for the moment of truth.

In this next chapter, I will share the exact financial questions I posed to Kiro, alongside the raw, unedited responses exactly as the AI generated them.

I started by asking Kiro some high-level questions about my account balances and historical transactions. It was genuinely amazing to watch the Kiro IDE orchestrate the local MCP server, connect seamlessly to the Open Banking sandbox, and start pulling down real-time data.

In production banking systems, transaction data is always heavily paginated—meaning you only get 100 or 200 records at a time, and you must read the pagination metadata to request the next page using a specific ID. Kiro didn't skip a beat: it independently parsed the pagination links, loop-queried the server, and completely traversed my entire transaction history on its own. I couldn't have been happier with how it performed!


## Could you list my bank accounts?

### Here are your bank accounts:
| # | Type | Account Number | Currency | Nickname |
|---|------|---------------|----------|----------|
| 1 | Current Account (CACC) | 70000098765401 | GBP | Damian Dyl |
| 2 | Savings (SVGS) | 70000098765402 | GBP | Damian Dyl |


## Could you retrieve all transaction history?

 I've retrieved the first page of transactions. There are more pages available. Here's a summary of what I can see from this page (most recent transactions first, spanning May 30 back to April 1). There's a second page with older transactions (Feb-Mar). Want me to fetch that too?

I asked Kiro to fetch it. 

I've now retrieved all transactions across both pages. Here's the complete 4-month summary:
Full Transaction History (Jan 31 – May 30, 2026)

### Monthly Income (4 salary credits):
| Date | Amount |
|------|------------| 
|Feb 28 | £3,500 |
|Mar 30 | £3,500 |
|Apr 29	 | £3,500 |
|May 29 | £3,500 | 

### Monthly Fixed Bills (recurring every month):
| Bill | Amount | Months |
| :--- | :--- | :--- |
| Mortgage Payment | £400 | Feb, Mar, Apr, May |
| Council Tax | £165 | Jan, Mar, Apr, May |
| Aviva Insurance | £67 | Feb, Mar, Apr, May |
| British Gas | £62.30 | Feb, Mar, Apr, May |
| EDF Energy | £45.80 | Feb, Mar, Apr, May |
| Direct Line Insurance | £45 | Feb, Mar, Apr, May |
| Sky TV | £39.99 | Feb, Mar, Apr, May |
| BT Broadband | £38.90 | Feb, Mar, Apr, May |
| Thames Water | £35 | Feb, Mar, Apr, May |
| PureGym | £29.99 | Jan, Mar, Apr, May |
| Microsoft 365 | £12.99 | Feb, Mar, Apr, May |
| Netflix | £9.99 | Feb, Mar, Apr, May |
| Spotify | £7.99 | Feb, Mar, Apr, May |
| Apple iCloud | £5.99 | Feb, Mar, Apr, May |

**Variable Spending Summary (across all 4 months):**
* **Groceries** (Tesco, Sainsbury's, Lidl, Aldi, Morrisons, Waitrose, Co-op, M&S Food, Iceland, Asda): ~50 transactions
* **Petrol** (Shell, BP, Esso, Texaco): ~16 transactions, £44-£84 each
* **Transport** (TfL, Uber, Trainline): ~80 transactions
* **Eating out** (Nando's, Wagamama, Pizza Express, KFC, Five Guys, McDonald's, Greggs, Pret, Costa, Starbucks): ~60 transactions
* **Shopping** (Amazon, John Lewis, Argos, Currys, Next, Primark, TK Maxx): ~25 transactions
* **Delivery** (Deliveroo, Just Eat, Uber Eats): ~20 transactions

## Group my transactions with a merchant. Who am I giving the most money to outside of rent/mortgage and utilities?

Based on your transaction data (excluding mortgage, council tax, and all utilities), here are your top merchants by total spend over 4 months:

### Top 15 Merchants (excl. housing & utilities):
| # | Merchant | 4-Month Total | Avg/Transaction | Transactions |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Trainline | ~£480 | £16 | ~30 |
| 2 | Uber | ~£460 | £12 | ~38 |
| 3 | Wagamama | ~£350 | £25 | ~14 |
| 4 | TK Maxx | ~£345 | £86 | ~4 |
| 5 | Nando's | ~£340 | £30 | ~11 |
| 6 | John Lewis | ~£345 | £115 | ~3 |
| 7 | Iceland | ~£330 | £66 | ~5 |
| 8 | Currys | ~£330 | £82 | ~4 |
| 9 | Lidl | ~£310 | £44 | ~7 |
| 10 | Texaco | ~£300 | £75 | ~4 |
| 11 | Pizza Express | ~£280 | £31 | ~9 |
| 12 | Morrisons | ~£270 | £54 | ~5 |
| 13 | Amazon | ~£260 | £87 | ~3 |
| 14 | McDonald's | ~£250 | £25 | ~10 |
| 15 | Shell | ~£230 | £76 | ~3 |

**Key takeaways:**
* **Trainline is your #1 non-essential merchant** — nearly £120/month on train travel. A railcard or season ticket could save 30%+.
* **Uber at #2** — ~£115/month on rides. Combined with Trainline, transport is your biggest discretionary category at ~£235/month.
* **Eating out dominates** — Wagamama, Nando's, Pizza Express, McDonald's combined: £1,220 over 4 months (£305/month).
* **Big-ticket shopping** — TK Maxx, John Lewis, Currys, Amazon: ~£1,280 over 4 months in fewer but larger transactions.
 * **Petrol** — Texaco + Shell + BP + Esso: £1,040 over 4 months (£260/month).


Wow this is great! I got a nice summary of my spendings. Now let’s ask for some unsolicited financial advice! 

## Analyze my transaction history from the last four months. What is my average monthly savings rate?

Based on the transaction data I already retrieved, here's the analysis:
Monthly Income:
Salary: £3,500/month × 4 months = £14,000 total income

### Monthly Fixed Outgoings (estimated from recurring bills):
| Category | Monthly |
| :--- | :--- |
| Mortgage | £400 |
| Council Tax | £165 |
| Aviva Insurance | £67 |
| British Gas | £62.30 |
| EDF Energy | £45.80 |
| Direct Line Insurance | £45 |
| Sky TV | £39.99 |
| BT Broadband | £38.90 |
| Thames Water | £35 |
| PureGym | £29.99 |
| Microsoft 365 | £12.99 |
| Netflix | £9.99 |
| Spotify | £7.99 |
| Apple iCloud | £5.99 |
| **Total Fixed** | **~£966/month** |

**Variable Spending (estimated from transaction totals across 4 months):**
* **Groceries**: ~£800/month
* **Petrol**: ~£260/month
* **Transport**: (TfL/Uber/Trainline): ~£200/month
* **Eating out/coffee**: ~£350/month
* **Shopping**: ~£300/month
* **Delivery**: ~£80/month
* **Total Variable**: ~£1,990/month

### Monthly Summary:
| Category | Amount |
| :--- | :--- |
| Income | £3,500 |
| Fixed bills | -£966 |
| Variable spending | -£1,990 |
| **Net savings** | **~£544/month** |

**Average monthly savings rate: ~15.5%**

That's a reasonable rate, though on the lower end for building wealth. Your biggest discretionary spending categories are eating out/takeaway (£350/month) and shopping (£300/month) — those would be the easiest levers to pull if you wanted to increase your savings rate.

## Identify any recurring subscription services I am paying for. Are there any duplicate or closely related ones?

Based on your transaction history, here are your recurring subscriptions:

### Entertainment & Streaming:
| Service | Monthly Cost | Category |
| :--- | :--- | :--- |
| Sky TV | £39.99 | TV/Streaming |
| Netflix | £9.99 | TV/Streaming |
| Spotify Premium | £7.99 | Music |

### Productivity & Cloud:
| Service | Monthly Cost | Category |
| :--- | :--- | :--- |
| Microsoft 365 | £12.99 | Productivity |
| Apple iCloud | £5.99 | Cloud Storage |

### Fitness:
| Service | Monthly Cost | Category |
| :--- | :--- | :--- |
| PureGym | £29.99 | Gym |

**Potential duplicates/overlaps:**
* **Sky TV + Netflix** (£49.98/month combined) Sky TV likely includes Sky Glass/Stream with some on-demand content. Netflix is a separate streaming service. If your Sky package already includes streaming apps or you primarily watch Netflix, you might be paying for overlapping TV content. Consider whether you actually use both regularly.
* **Microsoft 365 + Apple iCloud** (£18.98/month combined) Both include cloud storage (OneDrive 1TB with M365, iCloud storage). If you're using Microsoft 365 primarily for the Office apps, the overlap is minimal. But if you're paying for both mainly for storage, you could consolidate to one.
* **No clear duplicates** — each service serves a distinct primary purpose. But the Sky TV + Netflix combo is worth reviewing since Sky's streaming offerings have expanded significantly and may cover what you use Netflix for.

**Potential saving:** Dropping one streaming service could save £120-£480/year depending on which one.

## Analyze my food spending. How much am I spending on groceries versus dining out/delivery?

### Groceries
| Supermarket | 4-Month Total | Avg/Shop |
| :--- | :--- | :--- |
| Iceland | ~£330 | £66 |
| Lidl | ~£310 | £44 |
| Morrisons | ~£270 | £54 |
| M&S Food | ~£270 | £68 |
| Waitrose | ~£250 | £50 |
| Sainsbury's | ~£200 | £40 |
| Aldi | ~£190 | £48 |
| Co-op | ~£150 | £75 |
| Tesco | ~£130 | £32 |
| Asda | ~£190 | £48 |

**Groceries total:** ~£2,290 over 4 months → ~£573/month

### Dining Out (sit-down restaurants)
| Restaurant | 4-Month Total | Avg/Visit |
| :--- | :--- | :--- |
| Wagamama | ~£350 | £25 |
| Nando's | ~£340 | £30 |
| Pizza Express | ~£280 | £31 |
| Five Guys | ~£175 | £29 |
| KFC | ~£165 | £33 |
| McDonald's | ~£250 | £25 |

**Dining out total:** ~£1,560 over 4 months → ~£390/month

### Coffee & Quick Bites
| Merchant | 4-Month Total | Avg |
| :--- | :--- | :--- |
| Pret | ~£80 | £6 |
| Costa | ~£80 | £5 |
| Starbucks | ~£70 | £5 |
| Greggs | ~£60 | £6 |

**Coffee/quick bites total:** ~£290 over 4 months → ~£73/month

### Delivery
| Service | 4-Month Total | Avg/Order |
| :--- | :--- | :--- |
| Just Eat | ~£180 | £20 |
| Deliveroo | ~£140 | £14 |
| Uber Eats | ~£130 | £18 |

**Delivery total:** ~£450 over 4 months → ~£113/month

### Summary:
| Category | Monthly | % of Food Budget |
| :--- | :--- | :--- |
| Groceries | £573 | 50% |
| Dining out | £390 | 34% |
| Delivery | £113 | 10% |
| Coffee/bites | £73 | 6% |
| **Total food** | **£1,149** | **100%** |

**Key insight:**
 You're spending roughly the same on eating out + delivery (£503/month) as you are on groceries (£573/month). That's a near 50/50 split between cooking at home and eating out.
If you shifted just 25% of your dining/delivery spend to groceries, you'd save ~£125/month (£1,500/year) — since a home-cooked meal costs roughly £3-5 vs £20-30 at a restaurant.

## I'm thinking about taking on a new monthly car payment of 400gbp. Run a simulation against my last 3 months of data—how would this impact my ability to save?

### Current Monthly Budget (avg of last 3 months)
| Category | Amount |
| :--- | :--- |
| Income | £3,500 |
| Fixed bills | -£966 |
| Variable spending | -£1,990 |
| **Current savings** | **~£544/month** |
| **Savings rate** | **15.5%** |

### With £400/month Car Payment
| Category | Without Car | With Car | Change |
| :--- | :--- | :--- | :--- |
| Income | £3,500 | £3,500 | — |
| Fixed bills | £966 | £1,366 | +£400 |
| Variable spending | £1,990 | £1,990 | — |
| **Monthly savings** | **£544** | **£144** | **-£400** |
| **Savings rate** | **15.5%** | **4.1%** | **-11.4pp** |

**Impact Analysis:**
Your savings would drop from £544 to £144/month — a 74% reduction.

That leaves you with almost no buffer. A single unexpected expense (car repair, appliance breakdown, medical bill) would push you into deficit that month.

### But there's a potential offset: If the car replaces your current transport costs, some spending would shift:
| Current transport costs | Monthly |
| :--- | :--- |
| Petrol (Shell/BP/Esso/Texaco) | ~£260 |
| Uber | ~£115 |
| Trainline | ~£120 |
| TfL | ~£50 |
| **Total current transport** | **~£545** |

### If the car replaces Uber + Trainline (£235/month) but you still pay petrol (£260), your net new cost is:
| Category | Amount |
| :--- | :--- |
| Car payment | +£400 |
| Saved on Uber/Trainline | -£235 |
| **Net additional cost** | **+£165/month** |

### Adjusted Scenario (car replaces some transport)
| Category | Amount |
| :--- | :--- |
| Income | £3,500 |
| Fixed bills (incl. car) | £1,366 |
| Variable spending (minus Uber/Trainline) | £1,755 |
| **Monthly savings** | **£379** |
| **Savings rate** | **10.8%** |

**Verdict**
* **Worst case (car is purely additive):** Savings drop to £144/month (4.1%) — dangerously thin
* **Best case (car replaces Uber/trains):** Savings drop to £379/month (10.8%) — manageable but tight
* **Don't forget additional car costs:** insurance (~£50-100/month), maintenance, parking, MOT — these could eat another £100-150/month
* **Recommendation:** The car payment is affordable only if it genuinely replaces your current £235/month in Uber/Trainline spending AND you account for running costs. Otherwise, you'd need to cut ~£250/month from dining out or shopping to maintain a healthy savings rate.

## If I want to save 500 GBP more per month, based on my current transaction history, which specific categories have the room to be cut back?

Here's a realistic plan to save an extra £500/month, ranked by ease of cutting and impact:

### Savings Target: £500/month
| # | Category | Current Monthly | Proposed Cut | Savings | How |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Dining out | £390 | Cut by 50% | £195 | Cook more at home; limit restaurants to weekends only |
| 2 | Delivery | £113 | Cut by 75% | £85 | Batch cook instead of ordering in; keep 1 delivery/month as a treat |
| 3 | Uber | £115 | Cut by 60% | £69 | Walk/cycle short trips, use TfL for longer ones |
| 4 | Shopping | £300 | Cut by 40% | £120 | Implement a 48-hour rule before non-essential purchases; skip TK Maxx/John Lewis impulse buys |
| 5 | Coffee/bites | £73 | Cut by 50% | £37 | Make coffee at home; bring snacks |
| **Total** | | | | **£506** | |

**The Plan in Practice**
**Week-by-week changes:**

* **Mon–Fri:** Pack lunch, make coffee at home, use TfL/walk instead of Uber → saves ~£25/week
* **Weekends:** One restaurant meal max (not two), no delivery → saves ~£30/week
* **Monthly:** Skip one big shopping trip, delay Amazon/Currys purchases → saves ~£120/month

**What You Keep**
**This plan doesn't touch:**
* **Groceries** (£573 — you'll actually spend slightly more cooking at home)
* **Petrol** (£260 — needed for commuting)
* **Trainline** (£120 — likely work travel)
* **All subscriptions** (Netflix, Spotify, Sky, gym)
* **All fixed bills**



# Conclusions
## Cost Breakdown
Before giving summary for this experiment I wanted to include brakedown of credit usage to build Kiro MCP.

| Operation | Type | Execution Time | Credit Usage
| :--- | :--- | :--: | :--: | 
| Generate Steering Rules | Steering generation | 1m 7s | 0.93 |
| Generate Initial Requirements | Spec generation | 3m 53s | 6.79 |
| Additional Requirements | Spec update | 52s | 0.99 |
| Create Design Document | Design generation | 4m 37s | 4.02 | 
| Generate list of tasks | Tasks generation | 2m 1s | 1.71 | 
| Run all spec tasks (27 tasks, 5 waves) | Spec execution | 50m 41s | 62.93 | 
| Refactor tools: Object → typed records + generateOutputSchema Spec | Spec change | 20m 46s | 12.16 |  
| Refactor tools: Object → typed records + generateOutputSchema Code | Code change | 18m 54s | 37.24 |  
| Add `@JsonPropertyDescription` to all model records | Code change | 6m 51s | 9.45 |
| Generate sample_data.yaml (200 transactions) | Data generation | 6m 16s | 5.85 |
| Generate additional 200 transactions | Data generation | 4m 10s | 8.34 |
| Reverse transaction order in YAML | Data change | 1m 27s | 2.67 |
| Token service: read from properties | Code change | 2m 9s | 5.78 |
| Add `application.yaml` to `.gitignore` | Config | 32s | 1.91 | 
| Create MCP config (`.kiro/settings/mcp.json`) | Config | 22s | 1.47 |
| Add pagination (page param) to `TransactionTools` | Code change | 5m 1s | 11.87 | 
| Attempt `generateOutputSchema` + `@Nullable` (failed) | Investigation | 3m 39s | 6.23 | 
| Attempt jspecify `@Nullable` (failed) | Investigation | 1m 55s | 3.68 | 
| Attempt generateOutputSchema false (succeeded) | Investigation | 1m 27s | 4.89 | 
| Create `SchemaTools` + `response-schemas.json` | Code change | 3m 3s | 4.43 | 
| Regenerate sample_data.yaml (4 months, salary, mortgage) | Data generation | 4m 4s | 6.32 |
| Multiple jar rebuilds + MCP enable/disable cycles | Build/deploy | N/A | 30~ | 
| **Development Subtotal** | | | **~191.66** |
| | | | |
| Retrieve list of accounts  | Financial Advice | 19s | 2.63 |
| Retrieve all transaction history | Financial Advice | 32s | 3.56 |
| Calculate average monthly saving | Financial Advice | 22s | 2.01 |
| Review Subscriptions | Financial Advice | 32s | 2.01 |
| Group transactions by merchant | Financial Advice | 26s | 2.09 |
| Analyze food spending | Financial Advice | 16s | 2.11 |
| Car purchase advice | Financial Advice | 20s | 2.08 |
| Saving advice | Financial Advice | 31s | 2.13 |
| **Financial Advice Subtotal** | | | **16.62** |
| | | | |
| **Total Project Usage** | | | **~208.28** |

## The Financial Advisor: A Holistic Success
To be completely honest, I was thoroughly impressed by Kiro’s performance as a financial advisor. It seamlessly categorized my transactions by merchant and spending type, while providing insightful average spending statistics.

Where Kiro truly shined, however, was in offering nuanced purchasing advice and saving strategies. For instance, when asked if I could afford a car, it didn't just crunch the static numbers; it intelligently factored in lifestyle variables, noting that if the car replaced my current transit costs, the purchase would be significantly more viable. When suggesting saving strategies, Kiro went beyond standard cost-cutting to recommend practical, realistic lifestyle adjustments. 

Ultimately, having a holistic, highly summarized view of my spending habits proved to be incredibly valuable.

## The MCP Implementation: High Efficiency, Minor Friction
My experience implementing the Model Context Protocol (MCP) was a bit more mixed, largely due to LLM hallucination issues regarding Nullable annotations. It required several rounds of prompting and some manual research to finally get the code squared away. I would have preferred Kiro to generate structured response objects with appropriate annotations including descriptions out of the box, rather than defaulting to raw strings—likely an oversimplification choice on its part.

**The Silver Lining**: Despite the minor roadblock, I was amazed at how rapidly Kiro generated Data Transfer Objects (DTOs) from the specification, accurately marking optional fields as not required and appending clear descriptions. Furthermore, bootstrapping the MCP server itself was incredibly smooth. As someone new to Spring AI, I appreciated how little boilerplate effort was required to get the server up and running.

## The Future: Where AI and Finance Converge
The burning question is: Will we see deeper AI integration across the financial sector? I strongly believe the answer is a resounding yes. Looking ahead, I foresee this evolution happening across four distinct paradigms:

### Tier 1: Core Banking Apps with Embedded AI
This is already underway. The immediate step is for traditional financial institutions to embed AI directly into their proprietary apps. For example, spending analysis could be handled by securely passing transaction data to an internal, heavily guardrailed AI Agent. This allows banks to deliver immediate value within a highly controlled, enterprise-grade environment.

### Tier 2: Third-Party Providers (TPPs) Driving Innovation
Next, we will see FinTechs and TPPs leveraging Open Banking APIs to feed data into specialized, agentic AI layers. These applications will aggregate multi-bank data, run it through advanced analytical agents, and return highly personalized financial insights to users—all while maintaining strict data governance controls.

### Tier 3: Agentic AI Platforms Operating as TPPs
If the current trajectory of AI adoption holds, I wouldn't be surprised to see major AI providers register directly as Third-Party Providers. They could then build private MCP servers that interface directly with open banking APIs, allowing users to bring their own AI agents to their financial data.

### Tier 4: Open Banking Adopting MCP as a Native Standard
If AI agents become the primary interface through which consumers interact with their money, the Open Banking Specification may evolve to natively include MCP server endpoints.

By hosting native MCP servers, banks can create an incredibly secure, sandboxed environment for external AI agents. This opens up powerful governance capabilities:

* **Enforced Guardrails**: Banks could mandate human-in-the-loop validation for critical actions (like executing payments) to prevent AI hallucinations regarding transaction limits.

* **Granular Scoping via OAuth2**: Because MCP natively supports OAuth2, authorization can be dynamically mapped to AI tools. An MCP server could inspect a user's consent token and exclusively expose tools for authorized endpoints (e.g., exposing read_transactions while hiding read_balances).

The intersection of Open Banking and the Model Context Protocol holds immense potential. It bridges the gap between raw financial data and actionable, safe, and intelligent automation.

# Resources
* [Open Banking Specification](https://openbankinguk.github.io/read-write-api-site3/v4.0.1/profiles/read-write-data-api-profile.html)
* [The Open Banking MCP Implementation](https://github.com/ddyl-projects/openbanking-mcp)

**A Quick Disclaimer**: _While all the thoughts, experiences, and technical ideas on this blog are 100% mine, I use AI as an editorial co-pilot to refine, format, and simplify the text. My goal here is to maximize my time experimenting with new tech and writing about it, delegating the final syntax polish to AI speeds up that pipeline._

</div>