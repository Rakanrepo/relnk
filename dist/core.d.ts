import { type ObservePayload, type CompleteOptions, type CompleteResult } from "./types.js";
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
export declare function observe(payload: ObservePayload): Promise<void>;
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
export declare function complete(options: CompleteOptions): Promise<CompleteResult>;
//# sourceMappingURL=core.d.ts.map