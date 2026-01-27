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
exports.bootstrapCommand = bootstrapCommand;
var chalk_1 = require("chalk");
var inquirer_1 = require("inquirer");
var path_1 = require("path");
var git_js_1 = require("../../lib/git.js");
var paths_js_1 = require("../../lib/paths.js");
var ui_js_1 = require("../../lib/ui.js");
var execa_1 = require("execa");
function bootstrapCommand() {
    return __awaiter(this, void 0, void 0, function () {
        var _, worktrees, managedWts, choices, selectedPath, wtPath, installSpinner, e_1, _a, subSpinner, e_2, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 16, , 17]);
                    return [4 /*yield*/, (0, git_js_1.getRepoRoot)()];
                case 1:
                    _ = _b.sent();
                    return [4 /*yield*/, (0, git_js_1.listWorktrees)()];
                case 2:
                    worktrees = _b.sent();
                    managedWts = worktrees.filter(function (wt) { return wt.path.startsWith(paths_js_1.WORKTREES_ROOT); });
                    if (managedWts.length === 0) {
                        ui_js_1.log.info('No managed worktrees found to bootstrap.');
                        return [2 /*return*/];
                    }
                    choices = managedWts.map(function (wt) { return ({
                        name: "".concat(chalk_1.default.bold(path_1.default.basename(wt.path)), " (").concat(chalk_1.default.dim(wt.branch || wt.HEAD), ")"),
                        value: wt.path,
                    }); });
                    return [4 /*yield*/, inquirer_1.default.prompt([
                            {
                                type: 'list',
                                name: 'selectedPath',
                                message: 'Select worktree to bootstrap:',
                                choices: choices,
                            },
                        ])];
                case 3:
                    selectedPath = (_b.sent()).selectedPath;
                    wtPath = selectedPath;
                    ui_js_1.log.info("Bootstrapping ".concat(chalk_1.default.bold(path_1.default.basename(wtPath)), "..."));
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 10, , 11]);
                    return [4 /*yield*/, (0, execa_1.execa)('npm', ['--version'])];
                case 5:
                    _b.sent();
                    installSpinner = (0, ui_js_1.createSpinner)('Running npm install...').start();
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, (0, execa_1.execa)('npm', ['install'], { cwd: wtPath })];
                case 7:
                    _b.sent();
                    installSpinner.succeed('Dependencies installed.');
                    return [3 /*break*/, 9];
                case 8:
                    e_1 = _b.sent();
                    installSpinner.fail('npm install failed.');
                    ui_js_1.log.error(e_1.message);
                    return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 11];
                case 10:
                    _a = _b.sent();
                    ui_js_1.log.warning('npm not found, skipping install.');
                    return [3 /*break*/, 11];
                case 11:
                    subSpinner = (0, ui_js_1.createSpinner)('Syncing submodules...').start();
                    _b.label = 12;
                case 12:
                    _b.trys.push([12, 14, , 15]);
                    return [4 /*yield*/, (0, git_js_1.syncSubmodules)(wtPath)];
                case 13:
                    _b.sent();
                    subSpinner.succeed('Submodules synced.');
                    return [3 /*break*/, 15];
                case 14:
                    e_2 = _b.sent();
                    subSpinner.fail('Submodule sync failed.');
                    ui_js_1.log.error(e_2.message);
                    ui_js_1.log.warning('Tip: If auth failed, try adding your key to the agent.');
                    return [3 /*break*/, 15];
                case 15:
                    ui_js_1.log.success('Bootstrap completed!');
                    return [3 /*break*/, 17];
                case 16:
                    error_1 = _b.sent();
                    ui_js_1.log.error(error_1.message);
                    process.exit(1);
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/];
            }
        });
    });
}
