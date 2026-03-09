import type OpenAI from "openai";
import { type ObserveOpenAIOptions, type RelnkClientOptions } from "./types.js";
/**
 * Attaches Relnk observe middleware to an OpenAI client.
 * Intercepts chat.completions.create and sends a copy of each request/response to Relnk.
 * Works with any LLM when you use the OpenAI SDK (e.g. OpenAI-compatible APIs).
 * On observe failure, logs and continues; the user's call is never failed.
 */
export declare function observeOpenAI(openaiClient: OpenAI, options: ObserveOpenAIOptions): OpenAI;
/**
 * OpenAI complete-first client: tries Relnk /v1/complete first; on forward, calls OpenAI and observes.
 * Requires the `openai` package to be installed.
 */
export declare function createRelnkClient(options: RelnkClientOptions): Promise<OpenAI>;
//# sourceMappingURL=openai.d.ts.map