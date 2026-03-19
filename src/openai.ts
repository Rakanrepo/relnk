import type OpenAI from "openai";
import { getRelnkApiKey, type ObserveOpenAIOptions, type RelnkClientOptions } from "./types.js";
import { observe as observeCore, complete } from "./core.js";
import type { RelnkMessage, RelnkCompletionResponse } from "./types.js";

function toRelnkMessages(messages: OpenAI.Chat.ChatCompletionMessageParam[]): RelnkMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content : (m.content ?? []).map((p) => ("text" in p ? p.text : "")).join(""),
  }));
}

function toRelnkResponse(completion: OpenAI.Chat.ChatCompletion): RelnkCompletionResponse {
  return {
    choices: (completion.choices ?? []).map((c) => ({
      message: c.message
        ? {
            role: c.message.role,
            content: typeof c.message.content === "string" ? c.message.content : (c.message.content ?? []).join(""),
          }
        : undefined,
    })),
  };
}

/**
 * Wraps a stream to collect content and call observe when the stream ends.
 */
async function streamWithObserve<T extends OpenAI.Chat.ChatCompletionChunk>(
  stream: AsyncIterable<T>,
  ctx: { apiKey: string; messages: OpenAI.Chat.ChatCompletionMessageParam[]; model?: string }
): Promise<AsyncIterable<T>> {
  const chunks: T[] = [];
  const { apiKey, messages, model } = ctx;

  async function* wrapped(): AsyncGenerator<T> {
    for await (const chunk of stream) {
      chunks.push(chunk);
      yield chunk;
    }
    const content = chunks
      .map((c) => c.choices?.[0]?.delta?.content ?? "")
      .filter(Boolean)
      .join("");
    observeCore({
      relnkApiKey: apiKey,
      messages: toRelnkMessages(messages),
      model,
      response: { choices: [{ message: { role: "assistant", content } }] },
    }).catch(() => {});
  }

  return wrapped();
}

/**
 * Attaches Relnk observe middleware to an OpenAI client.
 * Intercepts chat.completions.create and sends a copy of each request/response to Relnk.
 * Works with any LLM when you use the OpenAI SDK (e.g. OpenAI-compatible APIs).
 * On observe failure, logs and continues; the user's call is never failed.
 */
export function observeOpenAI(openaiClient: OpenAI, options: ObserveOpenAIOptions): OpenAI {
  const apiKey = getRelnkApiKey(options.relnkApiKey);
  const chatCreate = openaiClient.chat.completions.create.bind(openaiClient.chat.completions);

  (openaiClient.chat.completions as unknown as Record<string, unknown>).create = async (
    params: OpenAI.Chat.ChatCompletionCreateParams,
    opts?: OpenAI.RequestOptions
  ) => {
    const messages = params.messages ?? [];
    const model = typeof params.model === "string" ? params.model : undefined;

    const result = await chatCreate(params, opts);

    if (!(params as { stream?: boolean }).stream) {
      const completion = result as OpenAI.Chat.ChatCompletion;
      observeCore({
        relnkApiKey: apiKey,
        messages: toRelnkMessages(messages),
        model,
        response: toRelnkResponse(completion),
      }).catch(() => {});
      return result;
    }

    const streamResult = result as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
    return streamWithObserve(streamResult, { apiKey, messages, model }) as ReturnType<typeof chatCreate>;
  };

  return openaiClient;
}

/**
 * OpenAI complete-first client: tries Relnk /v1/complete first; on forward, calls OpenAI and observes.
 * Requires the `openai` package to be installed.
 */
export async function createRelnkClient(options: RelnkClientOptions): Promise<OpenAI> {
  const relnkApiKey = getRelnkApiKey(options.relnkApiKey);
  const openaiApiKey = options.openaiApiKey;

  if (!openaiApiKey) {
    throw new Error("openaiApiKey is required for createRelnkClient");
  }

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: openaiApiKey });

  async function postObserve(
    apiKey: string,
    payload: { messages: RelnkMessage[]; model?: string; response: RelnkCompletionResponse }
  ): Promise<void> {
    observeCore({ relnkApiKey: apiKey, ...payload }).catch(() => {});
  }

  async function streamWithObserve(
    stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>,
    ctx: { apiKey: string; messages: RelnkMessage[]; model?: string }
  ): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk>> {
    const chunks: OpenAI.Chat.ChatCompletionChunk[] = [];
    async function* wrapped() {
      for await (const chunk of stream) {
        chunks.push(chunk);
        yield chunk;
      }
      const content = chunks.map((c) => c.choices?.[0]?.delta?.content ?? "").filter(Boolean).join("");
      postObserve(ctx.apiKey, {
        messages: ctx.messages,
        model: ctx.model,
        response: { choices: [{ message: { role: "assistant", content } }] },
      }).catch(() => {});
    }
    return wrapped();
  }

  const originalCreate = openai.chat.completions.create.bind(openai.chat.completions);

  (openai.chat.completions as unknown as Record<string, unknown>).create = async (
    params: OpenAI.Chat.ChatCompletionCreateParams,
    opts?: OpenAI.RequestOptions
  ) => {
    const messages = params.messages ?? [];
    const model = typeof params.model === "string" ? params.model : undefined;
    const stream = (params as { stream?: boolean }).stream === true;
    const relnkMessages = toRelnkMessages(messages);

    const result = await complete({ relnkApiKey, messages: relnkMessages, model });

    if ("forward" in result && result.forward) {
      const createResult = await originalCreate(params, opts);
      if (!stream) {
        const completion = createResult as OpenAI.Chat.ChatCompletion;
        postObserve(relnkApiKey, {
          messages: relnkMessages,
          model,
          response: toRelnkResponse(completion),
        }).catch(() => {});
      } else {
        const str = createResult as AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
        return streamWithObserve(str, { apiKey: relnkApiKey, messages: relnkMessages, model }) as ReturnType<
          typeof originalCreate
        >;
      }
      return createResult;
    }

    return (result as { completion: RelnkCompletionResponse & Record<string, unknown> }).completion as unknown as ReturnType<
      typeof originalCreate
    >;
  };

  return openai as unknown as OpenAI;
}
