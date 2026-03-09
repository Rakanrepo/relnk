"use strict";
/**
 * Relnk – observe and complete for any LLM provider.
 * Send request/response to Relnk for observation; ask Relnk to complete or forward to your provider.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELNK_API_BASE = exports.createRelnkClient = exports.observeOpenAI = exports.complete = exports.observe = void 0;
var core_js_1 = require("./core.js");
Object.defineProperty(exports, "observe", { enumerable: true, get: function () { return core_js_1.observe; } });
Object.defineProperty(exports, "complete", { enumerable: true, get: function () { return core_js_1.complete; } });
var openai_js_1 = require("./openai.js");
Object.defineProperty(exports, "observeOpenAI", { enumerable: true, get: function () { return openai_js_1.observeOpenAI; } });
Object.defineProperty(exports, "createRelnkClient", { enumerable: true, get: function () { return openai_js_1.createRelnkClient; } });
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "RELNK_API_BASE", { enumerable: true, get: function () { return types_js_1.RELNK_API_BASE; } });
