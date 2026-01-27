"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKTREES_ROOT = exports.AGENTS_ROOT = void 0;
var os_1 = require("os");
var path_1 = require("path");
exports.AGENTS_ROOT = path_1.default.join(os_1.default.homedir(), '.agents');
exports.WORKTREES_ROOT = path_1.default.join(exports.AGENTS_ROOT, 'worktrees');
