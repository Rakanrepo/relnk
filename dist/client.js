"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRelnkClient = createRelnkClient;
const types_js_1 = require("./types.js");
/**
 * Wraps a stream to observe the assembled response when the stream ends.
 */
async function streamWithObserve(stream, ctx) {
    const chunks = [];
    async function* wrapped() {
        for await (const chunk of stream) {
            chunks.push(chunk);
            yield chunk;
        }
        const content = chunks.map((c) => c.choices?.[0]?.delta?.content ?? "").filter(Boolean).join("");
        const responseLike = {
            id: "",
            object: "chat.completion",
            created: Date.now() / 1000,
            model: ctx.model ?? "",
            choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
        };
        postObserve(ctx.apiKey, { messages: ctx.messages, model: ctx.model, response: responseLike }).catch(() => { });
    }
    return wrapped();
}
/**
 * POST to Relnk /v1/observe (same as observe middleware).
 */
async function postObserve(apiKey, payload) {
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
 * Relnk client: tries Relnk /v1/complete first; on 204 or forward, calls OpenAI and observes.
 * Implements the same chat.completions.create surface as OpenAI for non-streaming and streaming.
 */
async function createRelnkClient(options) {
    const relnkApiKey = (0, types_js_1.getRelnkApiKey)(options.relnkApiKey);
    const openaiApiKey = options.openaiApiKey;
    if (!openaiApiKey) {
        throw new Error("openaiApiKey is required for createRelnkClient");
    }
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const completeUrl = `${types_js_1.RELNK_API_BASE}/v1/complete`;
    const originalCreate = openai.chat.completions.create.bind(openai.chat.completions);
    openai.chat.completions.create = async (params, opts) => {
        const messages = params.messages ?? [];
        const model = typeof params.model === "string" ? params.model : undefined;
        const stream = params.stream === true;
        const relnkRes = await fetch(completeUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${relnkApiKey}`,
            },
            body: JSON.stringify({ messages, model }),
        });
        if (relnkRes.status === 200) {
            const body = (await relnkRes.json());
            if (body.forward === true) {
                // Relnk says forward to OpenAI
                const result = await originalCreate(params, opts);
                if (!stream) {
                    const completion = result;
                    postObserve(relnkApiKey, { messages, model, response: completion }).catch(() => { });
                }
                else {
                    const str = result;
                    return streamWithObserve(str, { apiKey: relnkApiKey, messages, model });
                }
                return result;
            }
            // Relnk returned a completion
            return body;
        }
        if (relnkRes.status === 204) {
            // Forward to OpenAI
            const result = await originalCreate(params, opts);
            if (!stream) {
                const completion = result;
                postObserve(relnkApiKey, { messages, model, response: completion }).catch(() => { });
            }
            else {
                const str = result;
                return streamWithObserve(str, { apiKey: relnkApiKey, messages, model });
            }
            return result;
        }
        // Unexpected status: fall back to OpenAI
        return originalCreate(params, opts);
    };
    return openai;
}
