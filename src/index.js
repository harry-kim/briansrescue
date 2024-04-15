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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var neynarClient_1 = require("./neynarClient");
var quest_1 = require("./quest");
var kv_1 = require("@vercel/kv");
var express_1 = require("express");
var q = new quest_1.default(2);
q.printMap();
q.printMapLetters();
var DEFAULT_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours in milliseconds, clearly defined as a constant
var COOLDOWN_TIME = Number(process.env.COOLDOWN_TIME) || DEFAULT_COOLDOWN;
console.log("Starting...");
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3000;
// const server = Bun.serve({
// port: 3000,
// async fetch(req) {
app.post("/api/webhook", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var hookData, letter_direction, direction, replyText, now, author_fid, date, lastCommandTime, diffSinceLastCommand, replyResponse_1, error_1, moveSuccess, error_2, position, replyResponse, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 13]);
                if (!process.env.SIGNER_UUID) {
                    throw new Error("Make sure you set SIGNER_UUID in your .env file");
                }
                hookData = JSON.parse(req.body);
                letter_direction = hookData.data.text.split(" ")[1];
                direction = (0, quest_1.getDirection)(letter_direction);
                if (typeof direction === "undefined") {
                    console.log("unrecognized command");
                    return [2 /*return*/, new Response("Unrecognized command")];
                }
                replyText = void 0;
                now = new Date();
                author_fid = hookData.data.author.fid;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, kv_1.kv.get(author_fid)];
            case 2:
                date = (_a.sent()) || "";
                lastCommandTime = new Date(date);
                diffSinceLastCommand = now.getTime() - lastCommandTime.getTime();
                if (!(diffSinceLastCommand < COOLDOWN_TIME)) return [3 /*break*/, 4];
                replyText = "You must wait ".concat(diffSinceLastCommand, " until you can move Brian again!");
                return [4 /*yield*/, neynarClient_1.default.publishCast(process.env.SIGNER_UUID, replyText, {
                        replyTo: hookData.data.hash,
                    })];
            case 3:
                replyResponse_1 = _a.sent();
                return [2 /*return*/, new Response("Cooldown!")];
            case 4: return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                console.log("failed to get time of last command for ".concat(author_fid), error_1);
                return [2 /*return*/, new Response("Failed to get ")];
            case 6:
                moveSuccess = q.move(direction);
                _a.label = 7;
            case 7:
                _a.trys.push([7, 9, , 10]);
                return [4 /*yield*/, kv_1.kv.set(author_fid, now.toISOString())];
            case 8:
                _a.sent();
                return [3 /*break*/, 10];
            case 9:
                error_2 = _a.sent();
                console.log("failed to set time of last command for ".concat(author_fid), error_2);
                return [2 /*return*/, new Response("Failed to set ")];
            case 10:
                position = q.position();
                if (moveSuccess) {
                    if (q.wonGame()) {
                        replyText = "Brian has successfully escaped the SEC offices!\n You win!!!";
                    }
                    else {
                        replyText = "Brian moved ".concat(letter_direction, "\nCurrent position ").concat(position);
                    }
                }
                else {
                    replyText = "Brian got caught by Gensler!\nGoing back to last checkpoint: ".concat(position);
                }
                return [4 /*yield*/, neynarClient_1.default.publishCast(process.env.SIGNER_UUID, replyText, {
                        replyTo: hookData.data.hash,
                    })];
            case 11:
                replyResponse = _a.sent();
                console.log("REPLYING");
                // console.log(hookData);
                // console.log("reply:", reply);
                return [2 /*return*/, new Response("Welcome to bun!")];
            case 12:
                e_1 = _a.sent();
                console.log(e_1);
                return [2 /*return*/, new Response(e_1.message, { status: 500 })];
            case 13: return [2 /*return*/];
        }
    });
}); });
app.listen(PORT, function () {
    console.log("Server running on http://localhost:".concat(PORT));
});
exports.default = app;
