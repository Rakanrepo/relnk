"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observe = observe;
const types_js_1 = require("./types.js");
/**
 * Sends request/response to Relnk observe endpoint. Logs and continues on failure.
 */
async function sendObserve(apiKey, payload) {
    const url = `${types_js_1.RELNK_API_BASE}/v1/observe`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            console.warn("[relnk] observe POST failed:", res.status, await res.text());
        }
    }
    catch (err) {
        console.warn("[relnk] observe request error:", err);
    }
}
/**
 * Wraps a stream to collect content and call observe when the stream ends.
 */
async function streamWithObserve(stream, observeContext) {
    const chunks = [];
    const { apiKey, messages, model } = observeContext;
    async function* wrapped() {
        for await (const chunk of stream) {
            chunks.push(chunk);
            yield chunk;
        }
        const content = chunks
            .map((c) => c.choices?.[0]?.delta?.content ?? "")
            .filter(Boolean)
            .join("");
        const responseLike = {
            choices: [{ message: { role: "assistant", content } }],
        };
        sendObserve(apiKey, { messages, model, response: responseLike }).catch(() => { });
    }
    return wrapped();
}
/**
 * Attaches Relnk observe middleware to an OpenAI client.
 * Intercepts chat.completions.create: sends the request to OpenAI, then a copy to Relnk /v1/observe.
 * On observe failure, logs and continues; the user's call is never failed.
 *
 * @param openaiClient - Instance of OpenAI from the `openai` package
 * @param options - relnkApiKey (or RELNK_API_KEY), optional relnkBaseUrl (default https://api.relnk.ai, or RELNK_API_URL)
 * @returns The same client instance (mutated) for chaining
 */
function observe(openaiClient, options) {
    const apiKey = (0, types_js_1.getRelnkApiKey)(options.relnkApiKey);
    const chatCreate = openaiClient.chat.completions.create.bind(openaiClient.chat.completions);
    openaiClient.chat.completions.create = async (params, opts) => {
        const messages = params.messages ?? [];
        const model = typeof params.model === "string" ? params.model : undefined;
        const result = await chatCreate(params, opts);
        // Non-streaming: result is ChatCompletion
        if (!params.stream) {
            const completion = result;
            sendObserve(apiKey, { messages, model, response: completion }).catch(() => { });
            return result;
        }
        // Streaming: wrap the stream and observe when done
        const stream = result;
        return streamWithObserve(stream, { apiKey, messages, model });
    };
    return openaiClient;
}
