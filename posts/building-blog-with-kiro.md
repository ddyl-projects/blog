---
title: "Building a personal blog with Kiro"
date: "2026-05-18"
author: "Damian Dyl"
description: "In this article I will walk you through how I built this blog using Kiro. I will also share my thoughts on Kiro and Agentic AI software engineering."
tags:
  - javascript
  - css
  - kiro
---

# My First AI-Built Project: Building a Blog with AWS Kiro (And the Reality Check That Followed)


As I mentioned in my introduction, I decided that my first project would be to create a simple static website to serve as a blog for my articles. I wanted to keep the architecture as lean as possible: each article would be a markdown file, and a small snippet of JavaScript would pull them in and display them on the page. No databases, no backend servers—just pure, simple static hosting.

For the AI Agent, I decided to use AWS Kiro, which features "specification-driven development." This means the AI can actually plan the entire software development lifecycle, starting from requirements and design all the way through to implementation. It felt like the perfect tool to build an entire product from scratch. I was also hoping Kiro would handle the heavy lifting of complex prompt engineering and agent orchestration behind the scenes. (If you’re curious, Kiro also features a "Vibe Mode" where it can turn conversational prompts directly into live code changes).

![Articles dont render correctly](assets/images/article1/image4.png)

Without further ado, I purchased the "Kiro Pro" subscription, which gave me 1,000 credits for $20. If you're wondering how far that investment actually got me, I’ve included a full credit usage and cost breakdown at the end of this post.

P.S. Consider this section the "Hello World" of my Kiro journey. If you’d rather skip the play-by-play and dive straight into my unfiltered thoughts and the roadblocks I hit, feel free to jump right down to the summary!

**A Quick Disclaimer**: _While all the thoughts, experiences, and technical ideas on this blog are 100% mine, I use AI as an editorial co-pilot to refine, format, and simplify the text. My goal here is to maximize my time experimenting with new tech and writing about it, delegating the final syntax polish to AI speeds up that pipeline._

## The Vague Kickoff
I fired up the Kiro IDE for Windows, created a new specification file, and provided the AI Agent with some incredibly vague requirements:


> Generate a framework for a simple technical web blog that will be hosted on github. 
> All articles will be stored as markdown files.



The interaction felt amusingly familiar. It was almost exactly like the initial discussion my wife had when we were buying our very first car:

> What kind of car would you like?
>
> Well.. not a white one.


After a bit of processing, Kiro generated an initial specification complete with user stories:

>1. As a blog author, I want to write articles in markdown files with structured metadata, so that I can focus on content without dealing with HTML.
>2. As a blog author, I want a clear directory structure for storing articles, so that I can easily organize and find my content.
>3. As a blog author, I want my markdown articles transformed into a complete static website, so that I can host it on GitHub Pages without a backend.
>4. As a technical blog author, I want code blocks in my articles to have syntax highlighting, so that code examples are readable and professional.
>5. As a blog author, I want the generated site to deploy automatically to GitHub Pages, so that publishing new content requires only a git push.
>6. As a blog reader, I want the blog to be readable on any device, so that I can read articles on desktop or mobile.
>7. As a blog reader, I want to browse articles by tag, so that I can find related content on topics I'm interested in.
>8. As a blog author, I want a simple build command to generate my site, so that I can preview locally and deploy easily.

The initial specification can be found [here](assets/docs/article1/req1.md)


I must say, I was quite impressed at this point. My short prompt gave very few clues, but Kiro picked up on the nuances incredibly well.

From my markdown hint, it deduced that I didn't want to manage a database or manually edit HTML. It anticipated the needs of a "technical blog" by proactively adding a requirement for code syntax highlighting. By mentioning GitHub hosting, it correctly assumed I wanted to avoid backend servers entirely.

Finally, Kiro added standard, quality-of-life blog features like tag browsing and responsive design, while ensuring I had a local web server setup to preview my work.

![Kiro](assets/images/article1/image5.png)

## Moving the goalposts (As Clients Do)

I started slowly refining the requirements with follow-up prompts. However, I quickly realized I didn't like the fact that I had to manually build the website every time I wanted to update it. I'm pretending that I'm not technical - I want magic! All I wanted was to drop a new markdown file into the folder and watch it automatically appear on my brand-new blog.

So, I presented Kiro with a new requirement:


> * I want the articles to be stored as markup files in subdirectory and automatically recognized. 
> * I don't want to rebuild the static website everytime I add an article. 
> * I just want to upload new markdown files to my github repository.


Just like that, Kiro adapted and generated a new set of requirements:


> * As a blog author, I want my articles rendered dynamically in the browser, so that I can publish new content by simply pushing a markdown file to GitHub without triggering a rebuild.
>
> * As a blog author, I want articles to appear automatically after pushing markdown files to GitHub, so that publishing requires no manual build or deploy step.

The edited specification can be found [here](assets/docs/article1/req2.md)
## The Late-Night Prompt Dump

With the baseline established, it was time to inject some specific requirements to define the look, feel, and precise behavior of the site.

During my pre-project research, I read that it's occasionally more efficient to batch multiple requirements into a single prompt because it reduces the time the AI spends re-analyzing the entire project files. That said, using individual prompts has its perks: Kiro creates a checkpoint after every single operation. If the AI veers off course, you can easily restore your project to a specific state. You lose a bit of that safety net when you dump everything at once.

Naturally, I ignored the risk and dropped ten distinct requirements on Kiro in one go. I was staying up late that evening, which, looking back, probably had a severe impact on the quality of my prompting engineering!

> 1. The blog should have a right hand side menu displaying 10 latest articles.
> 2. Articles should have a date metadata which would be used to sort and display them.
> 3. The menu should also have a link leading to an index page containing a list of all articles.
> 4. The main page should have some introduction page which would be stored in root and called intro.md
> 5. Lets allow tags in the metadata but for now lets not add any search by tag features.
> 6. Each article should be displayed with the author name and date.
> 7. The website should have 4 sections - header, menu bar, footer and content area.
> 8. The website should use different tones of grey and  white for the sections.
> 9. The blog should have a modern, fresh look, with font suitable for a technical blog.
> 10. The blog should be responsive.

As you can tell, my list was a chaotic mix of functional features and explicit design constraints.

Kiro handled it in stride, updating the specification file to include all the changes. From a budget perspective, batching the requirements into a single prompt definitely saved credits, though I imagine that with larger, more complex enterprise projects, you risk cluttering the AI's context window.

The edited specification can be found [here](assets/docs/article1/req3.md)

## The Design Phase & Micro-Management

With requirements locked in, we moved to the "Design" stage.

Kiro immediately requested permission to fetch a handful of JavaScript libraries it planned to use for the architecture, including:

1. A Markdown Parser
2. File Manager
3. YAML Parser
4. REST API endpoints for markdown parsing

Admittedly, this part was a bit tedious. Kiro paused to ask for individual approval for every single library it downloaded.

Once approved, it generated a remarkably thorough technical design document:

> * **Architecture** — Vanilla JS with ES modules, hash-based routing, and an Article Manifest pattern for content discovery without API calls
> * **Key libraries** — marked.js (markdown), highlight.js (syntax highlighting), js-yaml (front matter parsing)
> * **Module structure** — Clean separation into router, manifest loader, renderer, front matter parser, and UI components
> * **Data models** — Manifest JSON schema, front matter schema, slug generation rules
> * **Correctness properties** — 10 formal properties covering parsing, validation, sorting, rendering, and navigation
> * **Error handling** — Graceful degradation for network failures, missing files, and invalid content
> * **Testing strategy** — Property-based tests with fast-check plus unit/integration tests with Vitest

The design file can be found [here](assets/docs/article1/design.md)

## Code Generation "Allow, Allow, Allow!"

Next up: task generation. Kiro parsed the requirements and design documentation and literally created a sequential checklist of prompts for itself to execute. Every implementation task was mapped directly back to a core requirement.

The full tasks list can be found [here](assets/docs/article1/tasks.md)

It also built an elegant parallel implementation schedule, grouping tasks into "waves." If Task B depended on Task A, it went into Wave 2. If tasks were completely independent, Kiro slated them to run simultaneously in Wave 1.

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.6"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5", "2.7"] },
    { "id": 3, "tasks": ["4.1", "4.4"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.5", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.8"] },
    { "id": 6, "tasks": ["5.5", "5.6", "5.7", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["8.1", "8.2"] },
    { "id": 9, "tasks": ["8.3", "9.1"] },
    { "id": 10, "tasks": ["11.1", "11.6"] },
    { "id": 11, "tasks": ["11.2", "11.3", "11.4"] },
    { "id": 12, "tasks": ["11.5"] },
    { "id": 13, "tasks": ["11.7"] }
  ]
}
```

With the strategy set, it was time to code!

The initial takeoff was slow. Kiro constantly pinged me for permission to run local PowerShell commands (node, npx, npm) and to create or modify local directories. But after I effectively granted it permission to execute almost every application on the internet, it flew through the task list.

Roughly one hour later, the AI finished building my personal blog. I was incredibly excited to see what it had spun up based on my vague, late-night instructions. I booted up the local Node server, opened my browser, and...

...Well, that was disappointing.

The website didn't really work. The articles failed to load entirely, and the sidebar menu was completely blank.

![Blank initial website|thumbnail](assets/images/article1/image1.png)

## Debugging: Inside the mind of the Machine

I gave Kiro the exact feedback I just gave you, and it began troubleshooting.

A quick lesson learned here: At the time, I took the wrong approach to bug fixing. I asked Kiro to resolve the issues by typing my complaints directly into our ongoing development chat. The best practice for Kiro is actually to spawn a brand-new specification designated specifically as a "bugfix" type. This forces the agent to have laser focus purely on the bugs. By using the standard chat, it defaults to Vibe Mode, meaning you risk the AI accidentally altering or breaking completely unrelated features. Definitely a mental note for next time!

Back to the grind: the AI prompted me with its initial root-cause analysis:

> There's the issue. The dev server is serve — a simple static file server. It doesn't handle bare module specifiers like import { Marked } from 'marked'. When the browser tries to resolve those imports, it fails silently.
> 
> You have two options to fix this:
> 
> 1. Switch to Vite as the dev server (recommended) — it handles bare imports from node_modules automatically
> 2. Add an import map to index.html pointing to CDN URLs

Kiro strongly recommended switching to Vite as the local development server, promising it would solve the problem. I was already too deeply invested to argue, so I gave it the green light.

After switching to Vite and letting Kiro run its automated fixes, the articles finally started loading. Well, sort of. The page structure appeared, but the visual formatting was completely broken.

![Articles dont render correctly|thumbnail](assets/images/article1/image2.png)

I fed Kiro another raw list of the visible layout bugs:

> I still have a lot of issues. To start with, when I want to load an article it doesn't appear.
> I just get "   "
> Next the footer section appears twice. Once with 2024 Technical Blog, second with 2026 date.
> The all articles section looks better but the header has different size and font color.

Kiro immediately began inspecting the source code modules to pinpoint the breakdown:

> Let me check the router to understand the slug matching issue. The article slug in the manifest is posts/getting-started-with-async-javascript but the router pattern is /article/:slug — the slug parameter only captures one path segment ([^/]+):”
>
> **Issue 1:** Article not loading — The router uses ([^/]+) for :slug, but slugs contain forward slashes (e.g., posts/getting-started-with-async-javascript). The route never matches.
>
> **Issue 2:** Duplicate footer — index.html already has footer content, and renderFooter() overwrites it with a new year (2026). But the HTML has the static 2024 text that briefly shows before JS runs. Actually, looking more carefully — the renderFooter() targets .site-footer which exists in HTML. This shouldn't duplicate. Let me check if there's a second footer being created elsewhere.
>
> **Issue 3:** Header styling — The site-title a link has no color styling, so it likely renders in default blue link color instead of white.

It executed fixes for the first two issues, then dug deeper into why the footer was duplicating:

> Now for the duplicate footer — the HTML has static content that renderFooter() replaces. But if there's a second footer being injected somewhere, let me check the index-page and intro components:
>
> The components look fine — no duplicate footer injection. The duplicate footer you're seeing is likely because the static HTML in index.html has "2024" and then renderFooter() creates "2026" (current year). But since renderFooter() replaces the innerHTML of .site-footer, it shouldn't show both. Unless the issue is that the static HTML briefly flashes before JS runs.
>
>Wait — looking at index.html again, the footer has static content AND renderFooter() overwrites it. The "2024" text in the HTML is just a placeholder. If you're seeing both, it might be that the footer element is being duplicated. Let me just remove the static footer content from index.html so there's no flash of old content.

In theory, the agent was simply running standard programmatic checks. However, its verbose, step-by-step commentary made it feel remarkably human—like watching a senior engineer narrate a deep debugging session. For a second, I felt like I was peering directly inside a sentient entity's mind.

> **Article not loading** — The router's :slug parameter only matched single path segments ([^/]+). Since slugs contain slashes (e.g., posts/getting-started-with-async-javascript), the route never matches. Fixed by using (.+) to capture the full slug including slashes.
>
> **Duplicate footer** — Removed the static "2024" footer content from index.html. Now only the JS-rendered footer appears (with the current year). Also removed the extra "Powered by Markdown" line.
>
> **Header link color** — Added color: inherit to .site-title a so the link renders in white (inheriting from the dark header) instead of default blue.

Kiro signed off, promising me that all outstanding issues were fully resolved. I hit refresh on my browser and...
Et voilà! It actually worked!

The sidebar menu functioned flawlessly, the articles page beautifully rendered the sample markdown text, and there wasn't a rogue HTML tag in sight. Honestly, for a first attempt driven entirely by an AI agent, what more could I ask for?

## New Requirements
I decided to push my luck and add one more requirement: filtering articles by tags. The process was reasonably straightforward, even if Kiro's documentation didn't quite line up with the actual options in the IDE (classic software behavior).

To kick things off, I handed Kiro a brand-new instruction:

> 1. I would like the ability to filter by tags on the articles page. 
> 2. At the top of the page there should be a list of top 20 tags.
> 3. Next to each tag there should be a count on how many articles match it, for example java (2). 
> 4. When you click on a tag, only articles that have the given tag will be shown. 
> 5. There should be an option to clear the tags. The tags should appear next to each other on the list.

Kiro has created the following user story:

> **Tag Filtering on Article Index**
> **User Story:** As a blog reader, I want to see popular tags on the article index page and filter articles by clicking a tag, so that I can quickly find content on topics I'm interested in.
>
> **Acceptance Criteria**
>
> 1. WHEN the Article_Index page is displayed, THE Blog_Application SHALL render a tag bar at the top of the page showing the 20 most popular tags sorted by article count in descending order
> 2. THE tag bar SHALL display each tag inline (horizontally, one next to another) with the article count in parentheses (e.g., "javascript (5)")
> 3. WHEN a reader clicks a tag in the tag bar, THE Blog_Application SHALL filter the article list to show only articles that contain the selected tag in their Front_Matter tags field
> 4. WHEN a tag filter is active, THE Blog_Application SHALL visually distinguish the selected tag from unselected tags (e.g., highlighted background or bold text)
> 5. WHEN a tag filter is active, THE Blog_Application SHALL display a "Clear filter" option that removes the tag filter and restores the full article list
> 6. IF no articles match the selected tag after filtering, THEN THE Blog_Application SHALL display a message indicating no articles were found for that tag

I then used “Sync Files” option which has updated the design:

> * **New design decision** — Client-side tag filtering using in-memory manifest data, no server round-trip or route change needed
> * **Tag filtering flow** — Sequence diagram covering navigate → render tag bar → click tag → filter → clear
> * **Tag popularity algorithm** — Aggregate counts, sort by count descending with alphabetical tiebreaker, return top 20
> * **Component interfaces** — Added getPopularTags(), filterByTag(), TagCount type, and index page tag filtering functions
> * **Tag bar UI spec** — HTML structure, behavior rules, and edge cases (no tags, no results)
> * **Two new correctness properties** — Tag popularity selection (Property 11) and tag filtering accuracy (Property 12)
> * **Error handling & testing** — Graceful degradation for empty tags/no results, plus tag-filtering.prop.test.js added to the test plan

With the new requirements set, I told Kiro to run the tasks—and just like that, the new feature was live! I was thrilled to find that, for once in software development history, the functionality worked flawlessly right out of the box.

![Tagging and filtering|thumbnail](assets/images/article1/image3.png)

# Summary
## Stats
Below is the final statistical breakdown of what Kiro built under the hood, along with the final tally of my $20 investment.

Kiro didn't just write the source code; it went heavy on quality assurance, generating a massive 99 test cases with over 1,000 assertions.

### The generated code breakdown:

| File type | Lines of content |
|  :--- | :---: |
| Javascript | 745 |
| Build Script | 173 |
| CSS | 376 | 
| HTML | 34 |
| Github actions workflow | 23 | 
| Vitest Config | 6 |
| Property Tests | 819 | 
| Unit Tests | 1019 |
| Integration Tests | 294 | 
  
### The credits usage:

| Operation | Execution Time | Credit Usage Estimate |
|  :--- | :---: | :---: |
| Initial Specification Creation | 3m 35s | 3.38 |
| Spec Amendment to automatically fetch articles | 1m 24s | 1.11 |
| Ten additional requirements | 1m 20s | 1.22 |
| Design Stage | 8m 33s | 3.41 | 
| Implementation^1 | 1h 42min | 61 |
| Missing Articles Investigation and Fix | 3m 44s | 2.97 |
| Fixing remaining issues | 1m 15s | 1.69 | 
| Update the specification to add tags | 26s | 0.54 |
| Update the design to add tags | 4m 19s | 4.39 |
| Update the tasks to add tags | 2m 18s | 1.81 | 
| Update code to add tags | 10m | 14.37 |
| Adding image thumbnail functionality | 33m 32s | 16.72 |
| Remaining queries^2 | N/A | 78.49 | 
<br>

^1 Unfortunately I stopped the implementation midway and I have lost some of the usage data - which I had to estimate/manually calculate.

^2 This includes misc queries, small features that I have implemented and trying to troubleshoot various small issues.

<br>

Total Credits Used **191.7** which in my current Kiro Pro Plan equals to **$3.83**. Not bad right? 


## My Opinion
### The good
The specification-driven mode is a game-changer. It actively encourages you to maintain comprehensive documentation that outlines your requirements, your architecture design, and your exact implementation steps. Early prompt engineering evolved through developers creating dedicated .agent files, but this specification-driven approach takes that practice to the next level. The resulting documentation is equally useful to both the human developer and the AI. An agent reading code only knows the how, but the specification gives it the much-needed why. Plus, the workflow itself forces you to carefully review and sign off on requirements before the agent ever touches a single line of code.

I was incredibly impressed by the agent's ability to expand vague, one-sentence prompts into full-blown, production-ready user stories. This didn't just drastically reduce my workload—it also automatically covered edge cases I hadn't even thought about yet.

I was equally impressed by how Kiro walked me through its entire thought process, explaining its actions step-by-step. Even though I was in the co-pilot seat letting the AI drive, I always felt completely in the loop.

The agent’s code-generation speed is remarkable. Not only has it rapidly generated all of the code. If I want to make any adjustements I don't have to search for the specific place in code, config or css. I just tell AI to do it and it finds the place for me. Admittedly, my front-end development days are firmly in the rearview mirror, so I decided not to meticulously critique the UI code architecture for this specific project. I’ll save my code-quality judgment for my upcoming projects, where I plan to put Kiro to work on core backend services.

But the real showstopper for me was Kiro’s debugging capability. At times, its reasoning process genuinely mirrored the internal monologue of a human developer hunting down a bug. It was a fantastic surprise to be able to simply say "feature X is broken," and watch Kiro scan the requirements, analyze the codebase, pinpoint the exact structural disconnect, and deploy a target patch.

I also really appreciated the interface. Instead of wrestling with a clunky graphical UI, you interact with Kiro directly using terminal commands inside the IDE. Integrating the prompt interface natively with your workspace is an incredibly smooth developer experience.

On top of that, you can feed Kiro custom "steering files" to enforce specific technologies, libraries, or engineering principles. For engineering teams, this is massive—it ensures identical coding standards and patterns are automatically maintained across all your repositories.

While all of these features are incredibly impressive, the ultimate advantage of a platform like Kiro is that it abstracts away the operational headache. As a developer, you don't have to worry about orchestrating multi-agent systems or managing the messy inner workings of AI context windows. You simply tell Kiro to implement a feature, and it handles the heavy lifting: spinning up the right specialized agents, drafting the specs, outlining the system design, mapping the tasks, and writing the code. It even runs automated verification steps (likely using critic-validator loops) to guarantee the final code actually matches your initial vision.
### The Bad
Remember how much I praised being able to control the entire IDE experience through a prompt interface? It truly is a fantastic developer experience—when it works flawlessly. However, during this project, I noticed that trying to dance between natural language prompting and standard GUI inputs simultaneously could occasionally leave the IDE in a bit of a corrupted state.

On multiple occasions, the workflow ground to a halt with an error:

> The meta.json file seems to be locked by another process. Let me check what's holding it.

Kiro would then dive down a rabbit hole, spending a considerable amount of time spinning up various PowerShell commands and clever environment tricks just trying to break the process lock on that file.

The underlying issue is that meta.json acts as the state machine for the agent, tracking internal progress during task execution. In the end, Kiro would usually give up on fixing the file lock directly, proceed to finish the coding tasks anyway, and then manually flip their status to completed inside the tasks.md manifest.

On one hand I deeply admired the self-healing autonomy of the AI, it hit a wall, found a workaround, and delivered the code. On the other hand, as the budget owner of this project, I really wish the IDE had behaved natively instead of burning through my paid credits just to resolve its own internal state issues.

 At one point, I asked the agent to edit the requirements file and regenerate the task list. Unfortunately, when I gave the command to execute, instead of scanning the delta and running only the pending tasks, Kiro decided to re-run the entire pipeline—including the tasks it had already successfully completed. To its credit, the agent recognized mid-flight that the code was already there, but the redundant evaluation pass took a long time. 

On another occasion, I requested a brand-new task. Kiro generated it perfectly, but immediately threw its hands up, claiming the new task ID was corrupted and it couldn't proceed with the implementation.

The other minor friction point—though I completely understand why it's architecturally necessary—was watching Kiro execute a massive stream of local PowerShell and npm commands. Having to audit and greenlight that volume of low-level terminal activity manually was undeniably painful.

Ultimately, these tooling quirks weren't showstoppers, and to be fair, they don't reflect on the core capabilities of the underlying LLM models. They are simply classic early-stage IDE integration bugs. As the ecosystem matures, stabilizing these local state-machine boundaries will be what elevates AI agents from cool engineering novelties to seamless, daily-driver developer tools.
### The Ugly
I think you probably know where this is going. The initial build simply wasn’t functional. The articles didn't appear. After Kiro applied a quick patch, I could finally see the list of articles, but the core functionality to actually display them was completely broken. We’re talking raw pieces of HTML bleeding onto the screen as plain text, wildly inconsistent page formatting, and structurally broken layout sections. Later on, when I asked Kiro to add a simple preview feature for attached markdown files, it successfully built the layout but included a "Back" button that didn’t actually do anything.

Unfortunately, this created a bigger problem than just a faulty codebase: it created a trust issue. I realized that despite the impressive specifications and documentation, I couldn't treat the agent as an autonomous team member yet. Everything it touched had to be thoroughly and meticulously code-reviewed.

The silver lining? Once I manually pointed out these specific failures, the agent was incredibly fast at diagnosing the root causes and deploying the correct fixes. It just needed that initial human push to look in the right direction.

#### Fixing The Ugly 
This got me thinking about how we can structurally eliminate these visual and routing blind spots within the current LLM architecture. Kiro is remarkably good at reflecting on its own mistakes and possesses a high level of self-awareness—but right now, you have to manually trigger that internal review. You explicitly have to prompt it: "Kiro, check the functionality and see if it’s working as expected."

So, how do we automate that trigger so the agent catches its own deployment bugs before a human does?

I think in my case the answer lies in integrating End-to-End (E2E) testing with a proper browser engine right into the agent's verification loop. If Kiro understands the foundational specification, it should be given the autonomy to spin up a headless browser, visually inspect the DOM elements, and verify the UI rendering against its own design criteria. If it knows what the website is supposed to look like and possesses the execution environment to check its own work, it can theoretically spot and patch layout regressions completely out-of-the-box.

#### Further issues after writing this article
Unfortunately, the deployment phase brought me right back to reality. When I uploaded the new website to GitHub, I immediately ran into similar environment issues as before. Kiro informed me that due to how the modules are loaded, I would actually need to build the website manually after all. It’s a bit disappointing because any future HTML layout edits will now require a build step, though the core goal remains intact: I can still upload new markdown articles seamlessly without it.

Then came the next snag: GitHub struggled to load markdown files containing YAML front-matter. It took quite a few prompts and some manual debugging on my end to figure out that GitHub was actually returning 404 errors for the articles. Once I pointed this out, Kiro finally diagnosed the culprit: it was an issue with Jekyll running behind the scenes on GitHub Pages.

### Final Thoughts
At the end of the day, this was just an experiment to build a simple static blog. And despite the quirks, the file locks, and the visual bugs, the tool drastically accelerated my development velocity.

But as a tech lead and a manager, the experience forced me to look past the code and think about the macro shift happening right now. AI-assisted programming is clearly becoming the norm, but my weekend project left me with a lot of practical questions about how we scale this in the enterprise over the next few years:

**The Last Mile of Quality**: How do we get to a point where an AI can write flawless, secure code on the first pass without relying on endless, credit-consuming validation loops?

**Reviewing at Scale**: If an agent can spin up hundreds of lines of code in seconds, how do human engineers code-review AI pull requests at scale without hitting massive cognitive fatigue?

**The Mentorship Gap**: How do we train and grow junior engineers when the baseline writing of code is delegated to an agent? If you don't wrestle with the early bugs, how do you build the intuition needed to become a Tech Lead?

**Managing Tech Debt**: If AI models operate on mathematical probability, how do we guarantee the code they generate today won't become an unmaintainable nightmare five years from now?

We are rapidly shifting from writing code to orchestrating outcomes, and the guardrails we build today will define our engineering organizations tomorrow.

If there are any MLEs or tech leaders in my network wrestling with these same operational hurdles, I’d love to hear how your teams are handling the gap between AI generation and production-grade trust!