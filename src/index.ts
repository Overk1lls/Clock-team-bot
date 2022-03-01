import { DiscordService } from './services/discord.service';
import { config as dotenvInit } from 'dotenv';
import { Client } from 'discord.js';
import { connect } from 'mongoose';
import { BlizzardService } from './services/blizzard.service';

dotenvInit();

const {
    DISCORD_BOT_TOKEN,
    BLIZZARD_AUTH_TOKEN,
    MONGODB_URI,
} = process.env;

connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const client = new Client();
const blizzardService = new BlizzardService();

const start = async () => {
    const discordClient = new DiscordService(
        client,
        DISCORD_BOT_TOKEN,
        blizzardService
    );

    await blizzardService.setup(BLIZZARD_AUTH_TOKEN);
    await discordClient.start();
};

start().catch(err => {
    console.error(err);
    process.exit(1);
});