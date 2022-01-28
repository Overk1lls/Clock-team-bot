import { config } from 'dotenv';
import DiscordService from './discord.service';
import { Client } from 'discord.js';

config();

const {
    DISCORD_BOT_TOKEN,
    BLIZZARD_AUTH_TOKEN
} = process.env;
const client = new Client();

const discordClient = new DiscordService(client, DISCORD_BOT_TOKEN, BLIZZARD_AUTH_TOKEN);

discordClient.start();