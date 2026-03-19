/** Relnk API base URL – all requests post to this host. */
export declare const RELNK_API_BASE = "https://api.relnk.ai";
/**
 * Generic chat message (any LLM provider).
 */
export interface RelnkMessage {
    role: string;
    content: string;
}
/**
 * Minimal completion response shape for observe (any LLM provider).
 */
export interface RelnkCompletionResponse {
    choices: Array<{
        message?: {
            role: string;
            content: string;
        };
    }>;
}
/**
 * Options for the generic observe() – send a request/response to Relnk for any provider.
 */
export interface ObservePayload {
    /** Relnk API key (or set RELNK_API_KEY env). */
    relnkApiKey: string;
    /** Chat messages (request). */
    messages: RelnkMessage[];
    /** Model identifier (optional). */
    model?: string;
    /** Completion response from your LLM. */
    response: RelnkCompletionResponse;
}
/**
 * Options for the generic complete() – ask Relnk to complete or forward.
 */
export interface CompleteOptions {
    /** Relnk API key (or set RELNK_API_KEY env). */
    relnkApiKey: string;
    /** Chat messages. */
    messages: RelnkMessage[];
    /** Model identifier (optional). */
    model?: string;
}
/**
 * Result of complete() when Relnk has a learned procedure (200).
 */
export interface CompleteResultCompletion {
    /** Relnk returned a completion; use this as your response. */
    completion: RelnkCompletionResponse & Record<string, unknown>;
}
/**
 * Result of complete() when Relnk says to call your LLM (204 or body.forward).
 */
export interface CompleteResultForward {
    forward: true;
}
export type CompleteResult = CompleteResultCompletion | CompleteResultForward;
/**
 * Options for the OpenAI adapter observeOpenAI().
 */
export interface ObserveOpenAIOptions {
    relnkApiKey: string;
}
/**
 * Options for createRelnkClient() (OpenAI complete-first client).
 */
export interface RelnkClientOptions {
    openaiApiKey: string;
    relnkApiKey: string;
}
/**
 * Resolve Relnk API key from options or env.
 */
export declare function getRelnkApiKey(optionsKey?: string): string;
//# sourceMappingURL=types.d.ts.map