"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodejs_sdk_1 = require("@neynar/nodejs-sdk");
if (!process.env.NEYNAR_API_KEY) {
    throw new Error("Make sure you set NEYNAR_API_KEY in your .env file");
}
var neynarClient = new nodejs_sdk_1.NeynarAPIClient(process.env.NEYNAR_API_KEY);
exports.default = neynarClient;
