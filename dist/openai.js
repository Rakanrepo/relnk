"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observeOpenAI = observeOpenAI;
exports.createRelnkClient = createRelnkClient;
const types_js_1 = require("./types.js");
const core_js_1 = require("./core.js");
function toRelnkMessages(messages) {
    return messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : (m.content ?? []).map((p) => ("text" in p ? p.text : "")).join(""),
    }));
}
function toRelnkResponse(completion) {
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
async function streamWithObserve(stream, ctx) {
    const chunks = [];
    const { apiKey, messages, model } = ctx;
    async function* wrapped() {
        for await (const chunk of stream) {
            chunks.push(chunk);
            yield chunk;
        }
        const content = chunks
            .map((c) => c.choices?.[0]?.delta?.content ?? "")
            .filter(Boolean)
            .join("");
        (0, core_js_1.observe)({
            relnkApiKey: apiKey,
            messages: toRelnkMessages(messages),
            model,
            response: { choices: [{ message: { role: "assistant", content } }] },
        }).catch(() => { });
    }
    return wrapped();
}
/**
 * Attaches Relnk observe middleware to an OpenAI client.
 * Intercepts chat.completions.create and sends a copy of each request/response to Relnk.
 * Works with any LLM when you use the OpenAI SDK (e.g. OpenAI-compatible APIs).
 * On observe failure, logs and continues; the user's call is never failed.
 */
function observeOpenAI(openaiClient, options) {
    const apiKey = (0, types_js_1.getRelnkApiKey)(options.relnkApiKey);
    const chatCreate = openaiClient.chat.completions.create.bind(openaiClient.chat.completions);
    openaiClient.chat.completions.create = async (params, opts) => {
        const messages = params.messages ?? [];
        const model = typeof params.model === "string" ? params.model : undefined;
        const result = await chatCreate(params, opts);
        if (!params.stream) {
            const completion = result;
            (0, core_js_1.observe)({
                relnkApiKey: apiKey,
                messages: toRelnkMessages(messages),
                model,
                response: toRelnkResponse(completion),
            }).catch(() => { });
            return result;
        }
        const streamResult = result;
        return streamWithObserve(streamResult, { apiKey, messages, model });
    };
    return openaiClient;
}
/**
 * OpenAI complete-first client: tries Relnk /v1/complete first; on forward, calls OpenAI and observes.
 * Requires the `openai` package to be installed.
 */
async function createRelnkClient(options) {
    const relnkApiKey = (0, types_js_1.getRelnkApiKey)(options.relnkApiKey);
    const openaiApiKey = options.openaiApiKey;
    if (!openaiApiKey) {
        throw new Error("openaiApiKey is required for createRelnkClient");
    }
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: openaiApiKey });
    async function postObserve(apiKey, payload) {
        (0, core_js_1.observe)({ relnkApiKey: apiKey, ...payload }).catch(() => { });
    }
    async function streamWithObserve(stream, ctx) {
        const chunks = [];
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
            }).catch(() => { });
        }
        return wrapped();
    }
    const originalCreate = openai.chat.completions.create.bind(openai.chat.completions);
    openai.chat.completions.create = async (params, opts) => {
        const messages = params.messages ?? [];
        const model = typeof params.model === "string" ? params.model : undefined;
        const stream = params.stream === true;
        const relnkMessages = toRelnkMessages(messages);
        const result = await (0, core_js_1.complete)({ relnkApiKey, messages: relnkMessages, model });
        if ("forward" in result && result.forward) {
            const createResult = await originalCreate(params, opts);
            if (!stream) {
                const completion = createResult;
                postObserve(relnkApiKey, {
                    messages: relnkMessages,
                    model,
                    response: toRelnkResponse(completion),
                }).catch(() => { });
            }
            else {
                const str = createResult;
                return streamWithObserve(str, { apiKey: relnkApiKey, messages: relnkMessages, model });
            }
            return createResult;
        }
        return result.completion;
    };
    return openai;
}
