# relnk

Relnk for **any LLM provider**: observe your chat request/response in Relnk and, when Relnk has learned a procedure, get the result from Relnk without calling your provider.

Works with OpenAI, Anthropic, OpenAI-compatible APIs, and any provider that returns messages and a completion.

## Install

```bash
npm install relnk
```

For the **OpenAI adapter** (optional): `npm install relnk openai`

Requires Node 18+.

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

| Variable         | Used when not passed in options |
|------------------|----------------------------------|
| `RELNK_API_KEY` | `relnkApiKey` in any API        |

Requests go to `https://api.relnk.ai/v1` (observe and complete).

---

## API

**Generic (any LLM)**  
- **`observe(payload)`** – `payload`: `{ relnkApiKey, messages, model?, response }`. POSTs to `/v1/observe`. Does not throw on failure (logs only).  
- **`complete(options)`** – `options`: `{ relnkApiKey, messages, model? }`. Returns `Promise<{ completion } | { forward: true }>`.

**OpenAI adapter** (requires `openai` installed)  
- **`observeOpenAI(openaiClient, options)`** – `options`: `{ relnkApiKey }`. Wraps `chat.completions.create` and observes each call.  
- **`createRelnkClient(options)`** – `options`: `{ openaiApiKey, relnkApiKey }`. Returns an OpenAI-like client that tries Relnk first, then OpenAI on forward.

For API keys and configuration, see [Relnk docs](https://relnk.io/docs).

## License

MIT
