"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var inquirer_1 = require("inquirer");
var ui_js_1 = require("./lib/ui.js");
var list_js_1 = require("./commands/wt/list.js");
var create_js_1 = require("./commands/wt/create.js");
var delete_js_1 = require("./commands/wt/delete.js");
var bootstrap_js_1 = require("./commands/wt/bootstrap.js");
var prune_js_1 = require("./commands/wt/prune.js");
var program = new commander_1.Command();
program
    .name('agents')
    .description('Interactive CLI for managing git worktrees and configs')
    .version('0.0.1')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var action, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: 
            // Interactive Menu if no command is provided
            return [4 /*yield*/, (0, ui_js_1.welcome)()];
            case 1:
                // Interactive Menu if no command is provided
                _b.sent();
                return [4 /*yield*/, inquirer_1.default.prompt([
                        {
                            type: 'list',
                            name: 'action',
                            message: 'What would you like to do?',
                            choices: [
                                { name: '🌱 Create new worktree', value: 'create' },
                                { name: '📋 List worktrees', value: 'list' },
                                { name: '🗑️ Delete worktree', value: 'delete' },
                                { name: '🚀 Bootstrap worktree', value: 'bootstrap' },
                                { name: '🧹 Prune stale worktrees', value: 'prune' },
                                new inquirer_1.default.Separator(),
                                { name: '🚪 Exit', value: 'exit' },
                            ],
                        },
                    ])];
            case 2:
                action = (_b.sent()).action;
                _a = action;
                switch (_a) {
                    case 'create': return [3 /*break*/, 3];
                    case 'list': return [3 /*break*/, 5];
                    case 'delete': return [3 /*break*/, 7];
                    case 'bootstrap': return [3 /*break*/, 9];
                    case 'prune': return [3 /*break*/, 11];
                    case 'exit': return [3 /*break*/, 13];
                }
                return [3 /*break*/, 14];
            case 3: 
            // For interactive mode, we pass defaults
            return [4 /*yield*/, (0, create_js_1.createCommand)({ bootstrap: true })];
            case 4:
                // For interactive mode, we pass defaults
                _b.sent();
                return [3 /*break*/, 14];
            case 5: return [4 /*yield*/, (0, list_js_1.listCommand)()];
            case 6:
                _b.sent();
                return [3 /*break*/, 14];
            case 7: return [4 /*yield*/, (0, delete_js_1.deleteCommand)()];
            case 8:
                _b.sent();
                return [3 /*break*/, 14];
            case 9: return [4 /*yield*/, (0, bootstrap_js_1.bootstrapCommand)()];
            case 10:
                _b.sent();
                return [3 /*break*/, 14];
            case 11: return [4 /*yield*/, (0, prune_js_1.pruneCommand)()];
            case 12:
                _b.sent();
                return [3 /*break*/, 14];
            case 13:
                ui_js_1.log.info('Bye! 👋');
                process.exit(0);
                _b.label = 14;
            case 14: return [2 /*return*/];
        }
    });
}); });
// --- Worktree Commands ---
var wt = program.command('wt').description('Manage git worktrees');
wt.command('list')
    .description('List all worktrees')
    .action(list_js_1.listCommand);
wt.command('create')
    .description('Create a new worktree')
    .option('-n, --name <slug>', 'Worktree name (slug)')
    .option('-r, --ref <ref>', 'Existing branch or ref')
    .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, create_js_1.createCommand)(options)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
wt.command('delete')
    .description('Delete a managed worktree')
    .action(delete_js_1.deleteCommand);
wt.command('bootstrap')
    .description('Bootstrap dependencies in a worktree')
    .action(bootstrap_js_1.bootstrapCommand);
wt.command('prune')
    .description('Prune stale worktree information')
    .action(prune_js_1.pruneCommand);
program.parse(process.argv);
