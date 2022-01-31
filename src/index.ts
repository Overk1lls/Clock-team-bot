import { config } from 'dotenv';
import DiscordService from './discord.service';
import { Client } from 'discord.js';
import { discordBotTagChannels } from './lib/config';
import { connect } from 'mongoose';

config();

const {
    DISCORD_BOT_TOKEN,
    BLIZZARD_AUTH_TOKEN,
    MONGODB_URI
} = process.env;

connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const client = new Client();
const discordClient = new DiscordService(client, DISCORD_BOT_TOKEN, BLIZZARD_AUTH_TOKEN, discordBotTagChannels);

discordClient.start();