---
title: "Self-Host Langflow: Run Your AI Pipelines on a Server You Own"
slug: self-host-langflow
meta_description: "Self-host Langflow to build RAG pipelines and agents visually, then run them on a server you control. The real architecture, where Postgres and pgvector fit, and when self-hosting beats SaaS."
target_keyword: self host langflow
secondary_keywords:
  - run langflow
  - langflow deploy
  - langflow self hosted
  - run langflow on a server
  - langflow rag pipeline
  - langflow pgvector
author: Kloudbean
hero_image: images/hero.png
cluster: 2 - Self-Hosted Tools
---

![Self-host Langflow: build and run LLM pipelines on a server you own](images/hero.png)

# Self-Host Langflow: Run Your AI Pipelines on a Server You Own

You built a slick RAG pipeline in Langflow. It answers questions from your own docs, calls a model, returns clean JSON. Then someone asks the awkward question: where does this actually run, and who can see the prompts, documents, and keys flowing through it?

That's usually the moment people go looking to self-host Langflow. Good instinct. Langflow is open source and written in Python, so you can run the whole thing on a server you own, keys and documents staying put. This guide covers what the docs skim: what Langflow really is, the three pieces its architecture needs (including where pgvector fits), how to run it on your own box, and when self-hosting beats a hosted option.

> **Short answer:** Langflow is an open-source, Python visual builder for LLM apps, RAG pipelines, and agents. To self-host Langflow, run the Python app on a managed Linux server, point it at a managed PostgreSQL (turn on pgvector for embeddings), and keep your model API keys in the server's environment. It stays light because Langflow orchestrates the model instead of running it, so a small CPU box is plenty.

## What Langflow actually is (and who should bother)

Langflow is a visual, low-code builder for AI apps. You drag nodes onto a canvas. A prompt here, a model there, a document loader, a bit of logic, and you wire them into a working flow: a chatbot, a RAG pipeline that answers from your own documents, or an agent that calls tools. When the flow works, Langflow exposes it as an API endpoint your real application can hit. That last part matters. A finished flow isn't a sketch, it's a callable backend.

So who's it for? People who want to prototype and run LLM pipelines without hand-writing all the glue code between the model, the retriever, and the vector store. If you've ever wired LangChain by hand, Langflow is the canvas on top of that idea. You still get a real endpoint at the end. You just skip a lot of boilerplate getting there.

And the reason to run Langflow yourself, rather than on someone else's platform, is simple: the flows carry your prompts, your documents, and your provider keys. Self-hosting keeps all of that on infrastructure you control.

<!-- ADD IMAGE: The Langflow canvas with a RAG flow wired up (document loader, embed node, vector store, retriever, prompt, model). Author screenshot. -->

## The architecture nobody explains up front

Here's where most "run Langflow" tutorials wave their hands. Langflow in production is three parts, and if you skip the middle one you'll lose work. The parts:

- **The Langflow app itself.** A Python process serving the canvas UI and your flows' API endpoints. This is the light bit.
- **A database for your flows.** Langflow saves your flows, users, and settings. Its default is a local file (SQLite). Fine on your laptop, wrong for a server. Point it at a managed PostgreSQL so your work survives a restart or a redeploy. Using a managed one also drags your flows into an existing backup job instead of leaving them in a file you'd have to remember to copy.
- **A vector store for embeddings.** Any RAG flow turns your documents into embeddings and needs somewhere to keep them. That's a vector database. You can run a dedicated one, or you can enable **pgvector** on the same managed Postgres and keep everything in one place.

That pgvector detail is the one people wish they'd known on day one. PostgreSQL with the `vector` extension stores and searches embeddings natively, so a small RAG project doesn't need a second piece of infrastructure. One managed Postgres does both jobs: it holds your saved flows and it holds your embeddings. Fewer moving parts, one thing to back up.

```
Your server (managed Linux) · Langflow pipeline
  Your docs → Embed → [ pgvector store on Postgres ] → Retrieve → Prompt → LLM
  The whole flow = one API endpoint your app calls
  Only the model call leaves the box (a Model API, or your own Ollama)
```

## Where the model actually runs: an API, or your own Ollama

This is the misunderstanding that scares people off self-hosting AI, so it's worth being blunt. Langflow does not run the neural network. It's the conductor, not the orchestra. Langflow shuffles text between nodes and decides what goes where. The heavy thinking happens in one of two places:

- **A hosted model API.** You point the LLM node at OpenAI, Anthropic, or similar. The model call goes out, the answer comes back. Simplest to start with. You pay that provider per call.
- **Your own model.** Run [Ollama on a separate box](https://www.kloudbean.com/blog/self-host-ollama-open-webui/) and point Langflow at it. Now the prompts never leave your infrastructure at all. That box wants real memory, and a GPU helps for speed, so it's the larger machine in the setup.

Either way, the Langflow server itself stays small. A CPU box around 2 GB of RAM runs it comfortably, because orchestrating text is cheap. The GPU question only shows up if you also self-host the model. Miss that distinction and you'll over-provision the wrong machine.

## A real example: a support bot that answers from your docs

Make it concrete. You want a support bot that answers using your own help articles. Classic RAG. In Langflow you'd wire a flow like this: a loader pulls in your docs, an embed node turns them into vectors and writes them to your pgvector store, a retrieval node finds the chunks most relevant to a question, a prompt node stitches those chunks into a prompt, and a model node generates the answer. Drag, connect, test on the canvas. Done.

Now the payoff. None of that needed a GPU on the Langflow server. The embeddings and the final answer came from a model API (or your own Ollama on another box). Langflow just moved text between steps and did the vector search in Postgres. When the flow works, you publish it as an endpoint and your support widget calls it. That's a production RAG feature, built visually, running on a small server you own, with your documents and keys never touring the internet.

<!-- ADD IMAGE: The published RAG endpoint answering a real support question, or the flow's API view in Langflow. Author screenshot. -->

## How to self-host Langflow on a server you own

Langflow is not a one-click app on Kloudbean, and that's fine, because it's an ordinary Python service. You run it on a managed Linux server the same way you'd run any Python app. Here's the shape of it.

### 1. Add a managed server

Spin up a server on the cloud and region you want. Around 2 GB of RAM is a sensible start for Langflow itself. The platform handles the OS, the stack, and free SSL, so you're not hand-patching Linux.

![The Kloudbean console Add Server screen: choose a cloud and size a small server for Langflow](../assets/console/add-server.png)

### 2. Launch a managed PostgreSQL (and turn on pgvector)

Create a managed PostgreSQL for Langflow's saved flows, then enable the vector extension so the same database can hold your embeddings. Two jobs, one database, one thing to back up.

![The Kloudbean console Launch Database screen with PostgreSQL selected for Langflow](../assets/console/launch-database.png)

```sql
-- in your managed PostgreSQL, once
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Set your keys and connection as environment variables

Your model provider keys and the database URL belong in the server's environment, never pasted into a flow or committed to Git. This is the step that keeps the keys yours.

![The Kloudbean console Environment Variables screen: model provider API keys and the Langflow database URL live on your server](../assets/console/env-vars.png)

```bash
# On your server, in the app's environment
LANGFLOW_DATABASE_URL=postgresql://langflow:secret@10.0.0.5:5432/langflow
OPENAI_API_KEY=sk-...           # or ANTHROPIC_API_KEY, etc.
LANGFLOW_AUTO_LOGIN=false        # require a login
LANGFLOW_SUPERUSER=admin
LANGFLOW_SUPERUSER_PASSWORD=change-me
```

### 4. Run it and put it behind your domain

Install and start Langflow, point a subdomain at it, and let the platform issue SSL. Now you've got a private Langflow at `flow.yourdomain.com`, wired to a real database, keys in the environment.

```bash
pip install langflow
langflow run --host 0.0.0.0 --port 7860
```

<!-- ADD IMAGE: Langflow open at your own subdomain with the SSL padlock showing, proving it runs on your infrastructure. Author screenshot. -->

## Self-host Langflow, or use a hosted option?

I'll take a position, because balanced-both-ways advice helps nobody. If you're just kicking tires on an idea and don't care where the flow runs, a hosted option is genuinely fine. Faster to start, nothing to maintain. But the moment your flows touch real customer data, real documents, or real provider keys, running Langflow yourself is the sensible call. Here's the split:

| | Self-hosted Langflow | Hosted / SaaS |
| --- | --- | --- |
| **Where data lives** | Your server, your region | The vendor's cloud |
| **Provider API keys** | In your server's environment | In the vendor's account |
| **Cost shape** | Flat server price | Often per seat or per run |
| **Ops** | You update the app; platform runs the box | Vendor handles it |
| **Reproducible on your infra** | Yes, it's your stack | Not really |
| **Best when** | Sensitive data, keys you must keep, repeatable setups | Quick prototype, throwaway flows |

## Where people get it wrong

A few sharp edges we see people hit, worth naming so you don't:

- **Leaving Langflow on its default file store.** The flows live in a local SQLite file, the server restarts or redeploys, and the work is gone. Point it at managed Postgres before you build anything you care about.
- **Baking keys into the flow.** Exporting a flow with the provider key typed into a node means the key rides along in the JSON. Keep keys in the environment, reference them, and they never leak into an export.
- **Under-sizing for ingestion.** Orchestration is light, but loading and embedding a big document set can spike memory for a while. If a large import gets killed, resize the box for the ingest, then scale back. On Kloudbean the resize up is self-serve, and one caveat worth knowing before you go big: disk can't be shrunk again afterwards, so grow RAM freely and grow disk deliberately.
- **Assuming Langflow needs a GPU.** It doesn't, unless you're also self-hosting the model. Put the GPU on the Ollama box, not the Langflow one.

## What running it yourself signs you up for

Before you commit, look at the ongoing work honestly, because that's what people underestimate. Three jobs land somewhere, and only one of them is really about hosting.

- **The Langflow app: yours.** Version upgrades, breaking changes between releases, flows that need rewiring after an upgrade. Langflow moves fast. No managed platform does this for you, and if you want the version bumps handled by someone else, that's a genuine reason to use the hosted product instead. Not a sales line, just true.
- **The box, the stack, the certificate: the platform's.** OS patching, the Python stack, free SSL on your subdomain, database backups. This is the half you can hand off, and on Kloudbean it's the default rather than something you configure.
- **Your keys, docs, and prompts: yours and nobody else's.** Which was the whole reason you started reading. Keep the provider keys in the server environment, and put IP allow-listing on the managed Postgres so only your app server can reach it.

So the decision cue is short. Kicking tyres on an idea, or you'd rather not track Langflow releases? Use the hosted version, honestly, it's fine. Flows carrying customer documents, a key you can't hand to a vendor, or a setup you need to rebuild identically next quarter? Run it yourself, and accept the upgrade chore as the price.

Nearby pieces if you're building the rest of it: pair it with [your own Ollama and Open WebUI](https://www.kloudbean.com/blog/self-host-ollama-open-webui/) to keep the model private, lean on [managed PostgreSQL](https://www.kloudbean.com/blog/managed-postgresql-hosting/) for flows and pgvector both, and since Langflow is light it'll [share one server with your other apps](https://www.kloudbean.com/blog/host-multiple-apps-one-server/). Wire [the wider AI app](https://www.kloudbean.com/blog/deploy-ai-built-app-to-production/) around it, let [automatic backups](https://www.kloudbean.com/blog/server-backups-guide/) cover the database, and browse the [self-hosted tools hub](https://www.kloudbean.com/blog/best-self-hosted-tools/) for the rest.

**Build the AI backend. Keep the keys, the docs, and the flows.** Run Langflow on a small managed server with a managed PostgreSQL and pgvector for embeddings, IP allow-listing, free SSL, and automatic backups. Start free at [kloudbean.com](https://www.kloudbean.com/), see plans on [pricing](https://www.kloudbean.com/pricing/).

Managed server · Managed PostgreSQL + pgvector · Automatic backups · Free SSL · Free trial

## FAQ

**Do I need a GPU to self-host Langflow?**
No. Langflow orchestrates the model rather than running it, so it's light. A CPU server around 2 GB of RAM is enough. A GPU only matters if you also self-host the model itself with Ollama, and that runs on a separate, larger machine.

**Can I build real apps with Langflow, or just demos?**
Real apps. A finished flow exposes an API endpoint your application calls, so Langflow is a genuine way to build AI backends: chatbots, RAG over your documents, and agents. The canvas is where you design it; the endpoint is what ships.

**What database should Langflow use in production?**
PostgreSQL. The default file storage is fine for a quick test, but a managed Postgres keeps your saved flows reliable across restarts and redeploys. Turn on the pgvector extension and the same database can also store your RAG embeddings.

**What is pgvector, and do I need it?**
pgvector is a PostgreSQL extension that stores and searches embeddings (vectors) natively. If your flow does RAG, you need somewhere to keep embeddings. pgvector lets your existing managed Postgres do that job, so a small project avoids running a second vector database.

**Where do my API keys live when I self-host?**
In your server's environment variables, under your control, not in a third-party platform. That's a core reason to self-host Langflow: your model provider keys and the data flowing through your flows stay on infrastructure you own.

**How much server does Langflow really need?**
The Langflow app is happy on a small CPU box, roughly 2 GB of RAM, because it shuffles text and makes API calls. Big document ingestion can spike memory briefly, so resize up for a heavy import if needed. The GPU, if any, belongs on the model box.

**Does self-hosting Langflow mean I stop paying for models?**
No. Langflow orchestrates models, it doesn't replace them. If it calls a hosted API you still pay that provider per use. If you self-host the model with Ollama, that model needs its own memory or GPU. Langflow's own server stays small either way.

**Can Langflow share a server with my other self-hosted tools?**
Yes. Because Langflow is light, it can run as one application alongside others on the same server, each on its own subdomain. That's the practical win of owning the box: one flat bill, several tools, including your AI flows.

---

*By Kloudbean · Build the pipeline, keep the keys.*
