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
exports.createCommand = createCommand;
var chalk_1 = require("chalk");
var inquirer_1 = require("inquirer");
var path_1 = require("path");
var git_js_1 = require("../../lib/git.js");
var paths_js_1 = require("../../lib/paths.js");
var ui_js_1 = require("../../lib/ui.js");
var execa_1 = require("execa");
function createCommand(options) {
    return __awaiter(this, void 0, void 0, function () {
        var repoRoot, answers, name_1, ref, shouldBootstrap, slug, wtPath, spinner, exists, e_1, installSpinner, e_2, _a, subSpinner, e_3, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 21, , 22]);
                    return [4 /*yield*/, (0, git_js_1.getRepoRoot)()];
                case 1:
                    repoRoot = _b.sent();
                    ui_js_1.log.info("Repo: ".concat(chalk_1.default.dim(repoRoot)));
                    return [4 /*yield*/, inquirer_1.default.prompt([
                            {
                                type: 'input',
                                name: 'name',
                                message: 'Worktree name (slug):',
                                default: options.name,
                                when: !options.name,
                                validate: function (input) { return input.trim().length > 0 || 'Name is required'; },
                            },
                            {
                                type: 'input',
                                name: 'ref',
                                message: 'Existing branch/ref to use:',
                                default: options.ref,
                                when: !options.ref,
                                validate: function (input) { return input.trim().length > 0 || 'Ref is required'; },
                            },
                            {
                                type: 'confirm',
                                name: 'bootstrap',
                                message: 'Run bootstrap? (npm install + submodules)',
                                default: true,
                                when: options.bootstrap !== false, // Skip if explicitly disabled via flag
                            },
                        ])];
                case 2:
                    answers = _b.sent();
                    name_1 = options.name || answers.name;
                    ref = options.ref || answers.ref;
                    shouldBootstrap = options.bootstrap === false ? false : answers.bootstrap;
                    slug = name_1.replace(/\s+/g, '-');
                    wtPath = path_1.default.join(paths_js_1.WORKTREES_ROOT, slug);
                    // 2. Validation
                    if (!slug)
                        throw new Error('Invalid name');
                    if (!ref)
                        throw new Error('Invalid ref');
                    spinner = (0, ui_js_1.createSpinner)('Fetching...').start();
                    return [4 /*yield*/, (0, git_js_1.fetchAll)()];
                case 3:
                    _b.sent();
                    spinner.text = 'Verifying ref...';
                    return [4 /*yield*/, (0, git_js_1.verifyRef)(ref)];
                case 4:
                    exists = _b.sent();
                    if (!exists) {
                        spinner.fail("Ref not found: ".concat(ref));
                        ui_js_1.log.warning("Tip: try 'origin/".concat(ref, "' or check if the branch exists."));
                        return [2 /*return*/];
                    }
                    spinner.text = "Creating worktree at ".concat(ui_js_1.ui.path(wtPath), "...");
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, (0, git_js_1.createWorktree)(wtPath, ref)];
                case 6:
                    _b.sent();
                    spinner.succeed('Worktree created.');
                    return [3 /*break*/, 8];
                case 7:
                    e_1 = _b.sent();
                    spinner.fail('Failed to create worktree.');
                    ui_js_1.log.error(e_1.message);
                    return [2 /*return*/];
                case 8:
                    if (!shouldBootstrap) return [3 /*break*/, 20];
                    ui_js_1.log.info('Bootstrapping...');
                    _b.label = 9;
                case 9:
                    _b.trys.push([9, 15, , 16]);
                    return [4 /*yield*/, (0, execa_1.execa)('npm', ['--version'])];
                case 10:
                    _b.sent();
                    installSpinner = (0, ui_js_1.createSpinner)('Running npm install...').start();
                    _b.label = 11;
                case 11:
                    _b.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, (0, execa_1.execa)('npm', ['install'], { cwd: wtPath })];
                case 12:
                    _b.sent();
                    installSpinner.succeed('Dependencies installed.');
                    return [3 /*break*/, 14];
                case 13:
                    e_2 = _b.sent();
                    installSpinner.fail('npm install failed.');
                    ui_js_1.log.error(e_2.message);
                    return [3 /*break*/, 14];
                case 14: return [3 /*break*/, 16];
                case 15:
                    _a = _b.sent();
                    ui_js_1.log.warning('npm not found, skipping install.');
                    return [3 /*break*/, 16];
                case 16:
                    subSpinner = (0, ui_js_1.createSpinner)('Syncing submodules...').start();
                    _b.label = 17;
                case 17:
                    _b.trys.push([17, 19, , 20]);
                    return [4 /*yield*/, (0, git_js_1.syncSubmodules)(wtPath)];
                case 18:
                    _b.sent();
                    subSpinner.succeed('Submodules synced.');
                    return [3 /*break*/, 20];
                case 19:
                    e_3 = _b.sent();
                    subSpinner.fail('Submodule sync failed.');
                    ui_js_1.log.error(e_3.message);
                    ui_js_1.log.warning('Tip: If auth failed, try adding your key to the agent.');
                    return [3 /*break*/, 20];
                case 20:
                    // 5. Final Output
                    ui_js_1.log.success('Worktree ready!');
                    ui_js_1.log.header("cd \"".concat(wtPath, "\""));
                    return [3 /*break*/, 22];
                case 21:
                    error_1 = _b.sent();
                    ui_js_1.log.error(error_1.message);
                    process.exit(1);
                    return [3 /*break*/, 22];
                case 22: return [2 /*return*/];
            }
        });
    });
}
