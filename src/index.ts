import { config as dotenvInit } from 'dotenv';
import { DiscordService } from './services/discord.service';
import { BlizzardService } from './services/blizzard.service';
import { MongoDBService } from './services/mongodb.service';

dotenvInit();

const {
    DISCORD_BOT_TOKEN,
    BLIZZARD_AUTH_TOKEN,
    MONGODB_URI,
} = process.env;

const mongodbService = new MongoDBService(MONGODB_URI);
const blizzardService = new BlizzardService(BLIZZARD_AUTH_TOKEN);
const discordClient = new DiscordService(
    DISCORD_BOT_TOKEN,
    blizzardService
);

const start = async () => {
    await mongodbService.connect();
    await blizzardService.start();
    await discordClient.start();
};

start().catch(err => {
    console.error(err);
    process.exit(1);
});
