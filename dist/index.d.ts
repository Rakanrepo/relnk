/**
 * Relnk – observe and complete for any LLM provider.
 * Send request/response to Relnk for observation; ask Relnk to complete or forward to your provider.
 *
 * @packageDocumentation
 */
export { observe, complete } from "./core.js";
export { observeOpenAI, createRelnkClient } from "./openai.js";
export { RELNK_API_BASE } from "./types.js";
export type { RelnkMessage, RelnkCompletionResponse, ObservePayload, CompleteOptions, CompleteResult, CompleteResultCompletion, CompleteResultForward, ObserveOpenAIOptions, RelnkClientOptions, } from "./types.js";
//# sourceMappingURL=index.d.ts.map