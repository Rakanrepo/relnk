"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observe = observe;
exports.complete = complete;
const types_js_1 = require("./types.js");
/**
 * Sends request/response to Relnk observe endpoint.
 * Use this with any LLM provider: after you get a response, call observe() so Relnk can learn.
 * Logs and continues on failure; does not throw.
 *
 * @example
 * // With any provider (Anthropic, OpenAI, etc.)
 * const response = await myLLM.chat({ messages, model });
 * await observe({
 *   relnkApiKey: process.env.RELNK_API_KEY,
 *   messages: messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' })),
 *   model,
 *   response: { choices: [{ message: { role: 'assistant', content: response.content } }] },
 * });
 */
async function observe(payload) {
    const apiKey = payload.relnkApiKey ?? process.env["RELNK_API_KEY"];
    if (!apiKey) {
        console.warn("[relnk] observe skipped: no relnkApiKey or RELNK_API_KEY");
        return;
    }
    const url = `${types_js_1.RELNK_API_BASE}/v1/observe`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                messages: payload.messages,
                model: payload.model,
                response: payload.response,
            }),
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
 * Asks Relnk to complete the conversation. If Relnk has a learned procedure it returns the completion;
 * otherwise it returns { forward: true } and you should call your LLM and then observe() the result.
 *
 * @example
 * const result = await complete({ relnkApiKey, messages, model });
 * if ('forward' in result) {
 *   const response = await myLLM.chat({ messages, model });
 *   await observe({ relnkApiKey, messages, model, response });
 *   return response;
 * }
 * return result.completion;
 */
async function complete(options) {
    const apiKey = options.relnkApiKey ?? process.env["RELNK_API_KEY"];
    if (!apiKey) {
        throw new Error("Relnk API key required: set relnkApiKey in options or RELNK_API_KEY");
    }
    const url = `${types_js_1.RELNK_API_BASE}/v1/complete`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            messages: options.messages,
            model: options.model,
        }),
    });
    if (res.status === 204) {
        return { forward: true };
    }
    if (res.status === 200) {
        const body = (await res.json());
        if (body.forward === true) {
            return { forward: true };
        }
        return { completion: body };
    }
    // Unexpected: treat as forward
    return { forward: true };
}
