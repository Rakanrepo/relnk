<div align="center">
  <a href="https://relnk.io/">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="logo.svg">
      <source media="(prefers-color-scheme: dark)" srcset="logo.svg">
      <img alt="Relnk Logo" src="logo.svg" width="50%">
    </picture>
  </a>
</div>

<div align="center">
  <h3>Observe, learn, execute.</h3>
</div>

<div align="center">
  <a href="https://www.npmjs.com/package/relnk" target="_blank"><img src="https://img.shields.io/npm/v/relnk.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org/" target="_blank"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node.js"></a>
</div>

Relnk is a middleware layer for **any LLM provider**. You keep calling your existing models (OpenAI, Anthropic, or any API); Relnk observes request/response traffic, learns recurring procedures, and can return learned results so you call the LLM less often. One SDK works with every provider.

```bash
npm install relnk
```

For drop-in integration with the OpenAI client (observe or complete-first without changing your code), also install the optional peer: `npm install relnk openai`.

---

**Documentation**:

- [relnk.io/docs](https://relnk.io/docs) – API keys, configuration, and how Relnk learns
- [npm – relnk](https://www.npmjs.com/package/relnk) – Package and version history

**Community**: Share feedback and questions in the [Relnk community](https://relnk.io/docs) or open an issue on GitHub.

> [!NOTE]
> Relnk works with any LLM. Use the generic `observe()` and `complete()` for your provider, or the **OpenAI adapter** (`observeOpenAI`, `createRelnkClient`) if you use the `openai` package.

## Why use Relnk?

Relnk helps you reduce cost and latency by learning from your LLM traffic and serving learned procedures when possible, while keeping your app provider-agnostic.

Use Relnk for:

- **Provider-agnostic observability**. Send request/response to Relnk from any LLM (OpenAI, Anthropic, OpenAI-compatible APIs, or custom). One integration pattern works everywhere.
- **Learn once, execute locally**. When Relnk has learned a procedure for a given pattern, it can return the result without calling your provider – cutting cost and latency for repeated or deterministic flows.
- **Minimal code changes**. Use the generic `observe()` after your existing LLM calls, or wrap the OpenAI client with `observeOpenAI()` so every call is observed without touching business logic.
- **Complete-first or observe-only**. Choose observe-only (always call your LLM, Relnk just watches) or complete-first (ask Relnk first; it forwards to your LLM when it hasn’t learned yet and observes the result).
- **Streaming support**. Relnk is notified after streams complete, so you can keep using streaming responses while still feeding Relnk for learning.

## Relnk and your stack

Relnk fits into your current setup without replacing your LLM client:

- **Generic API** – `observe()` and `complete()` work with any provider. Call your LLM, then `observe()` with messages and response; or call `complete()` first and only hit your LLM when Relnk returns `{ forward: true }`.
- **OpenAI adapter** – If you use the `openai` package, use `observeOpenAI(client, options)` or `createRelnkClient(options)` for a drop-in client that observes or runs complete-first.
- **API** – All traffic is sent to `https://api.relnk.ai/v1` (observe and complete endpoints). Configure with `RELNK_API_KEY` or pass `relnkApiKey` in options.

## Additional resources

- [API reference](#api) – `observe`, `complete`, `observeOpenAI`, `createRelnkClient`
- [Relnk docs](https://relnk.io/docs) – Configuration and how learning works
- [License](https://opensource.org/licenses/MIT) – MIT

---

## Table of contents

- [Install](#install)
- [Use with any LLM (generic API)](#use-with-any-llm-generic-api)
- [OpenAI adapter](#openai-adapter-optional)
- [Environment variables](#environment-variables)
- [API](#api)
- [License](#license)

## Install

```bash
npm install relnk
```

For the **OpenAI adapter** (optional):

```bash
npm install relnk openai
```

Requires **Node 18+**.

---

## Use with any LLM (generic API)

After you get a response from any provider, send it to Relnk with `observe()`. Use `complete()` to ask Relnk to complete first; if it returns `{ forward: true }`, call your LLM and then `observe()`.

### Observe (any provider)

```ts
import { observe } from "relnk";

// After your LLM returns a response (OpenAI, Anthropic, etc.)
const messages = [{ role: "user", content: "Hello" }];
const response = await myLLM.chat({ messages, model: "gpt-4o-mini" }); // your provider

await observe({
  relnkApiKey: process.env.RELNK_API_KEY,
  messages,
  model: "gpt-4o-mini",
  response: {
    choices: [{ message: { role: "assistant", content: response.content } }],
  },
});
```

### Complete first (any provider)

```ts
import { observe, complete } from "relnk";

const messages = [{ role: "user", content: "Hello" }];
const result = await complete({
  relnkApiKey: process.env.RELNK_API_KEY,
  messages,
  model: "gpt-4o-mini",
});

if ("forward" in result && result.forward) {
  const response = await myLLM.chat({ messages, model: "gpt-4o-mini" });
  await observe({
    relnkApiKey: process.env.RELNK_API_KEY,
    messages,
    model: "gpt-4o-mini",
    response: {
      choices: [{ message: { role: "assistant", content: response.content } }],
    },
  });
  return response;
}

return result.completion;
```

---

## OpenAI adapter (optional)

If you use the official `openai` package (or an OpenAI-compatible API), you can wrap the client so every call is observed or complete-first without changing your code.

### Observe with OpenAI client

```ts
import OpenAI from "openai";
import { observeOpenAI } from "relnk";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
observeOpenAI(openai, { relnkApiKey: process.env.RELNK_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello" }],
});
```

Works with streaming too; Relnk is notified after the stream ends.

### Complete-first with OpenAI

```ts
import { createRelnkClient } from "relnk";

const openai = await createRelnkClient({
  openaiApiKey: process.env.OPENAI_API_KEY,
  relnkApiKey: process.env.RELNK_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello" }],
});
```

---

## Environment variables

| Variable         | Description                                      |
|------------------|--------------------------------------------------|
| `RELNK_API_KEY`  | Relnk API key (used when `relnkApiKey` not set)  |

Requests go to `https://api.relnk.ai/v1` (observe and complete).

---

## API

### Generic (any LLM)

| Function      | Description |
|---------------|-------------|
| `observe(payload)` | `payload`: `{ relnkApiKey, messages, model?, response }`. POSTs to `/v1/observe`. Does not throw on failure (logs only). |
| `complete(options)` | `options`: `{ relnkApiKey, messages, model? }`. Returns `Promise<{ completion } \| { forward: true }>`. |

### OpenAI adapter (requires `openai` installed)

| Function      | Description |
|---------------|-------------|
| `observeOpenAI(openaiClient, options)` | `options`: `{ relnkApiKey }`. Wraps `chat.completions.create` and observes each call. |
| `createRelnkClient(options)` | `options`: `{ openaiApiKey, relnkApiKey }`. Returns an OpenAI-like client that tries Relnk first, then OpenAI on forward. |

For API keys and configuration, see [Relnk docs](https://relnk.io/docs).

---

## License

[MIT](https://opensource.org/licenses/MIT)
