import type OpenAI from "openai";
import { type RelnkClientOptions } from "./types.js";
/**
 * Relnk client: tries Relnk /v1/complete first; on 204 or forward, calls OpenAI and observes.
 * Implements the same chat.completions.create surface as OpenAI for non-streaming and streaming.
 */
export declare function createRelnkClient(options: RelnkClientOptions): Promise<OpenAI>;
//# sourceMappingURL=client.d.ts.map