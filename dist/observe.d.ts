import type OpenAI from "openai";
import { type ObserveOptions } from "./types.js";
/**
 * Attaches Relnk observe middleware to an OpenAI client.
 * Intercepts chat.completions.create: sends the request to OpenAI, then a copy to Relnk /v1/observe.
 * On observe failure, logs and continues; the user's call is never failed.
 *
 * @param openaiClient - Instance of OpenAI from the `openai` package
 * @param options - relnkApiKey (or RELNK_API_KEY), optional relnkBaseUrl (default https://api.relnk.ai, or RELNK_API_URL)
 * @returns The same client instance (mutated) for chaining
 */
export declare function observe(openaiClient: OpenAI, options: ObserveOptions): OpenAI;
//# sourceMappingURL=observe.d.ts.map