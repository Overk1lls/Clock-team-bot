"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const discord_service_1 = __importDefault(require("./discord.service"));
const discord_js_1 = require("discord.js");
(0, dotenv_1.config)();
// async function start() {
//     await fetchBlizzardToken();
// }
// start();
const { DISCORD_BOT_TOKEN, BLIZZARD_AUTH_TOKEN } = process.env;
const client = new discord_js_1.Client();
const discordClient = new discord_service_1.default(client, DISCORD_BOT_TOKEN, BLIZZARD_AUTH_TOKEN);
discordClient.start();
