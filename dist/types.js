"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELNK_API_BASE = void 0;
exports.getRelnkApiKey = getRelnkApiKey;
/** Relnk API base URL – all requests post to this host. */
exports.RELNK_API_BASE = "https://api.relnk.ai";
/**
 * Resolve Relnk API key from options or env.
 */
function getRelnkApiKey(optionsKey) {
    const key = optionsKey ?? process.env["RELNK_API_KEY"];
    if (!key) {
        throw new Error("Relnk API key required: set relnkApiKey in options or RELNK_API_KEY");
    }
    return key;
}
