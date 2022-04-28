import { config as dotenvInit } from 'dotenv';
import { DiscordService } from './services/discord';
import { BlizzardService } from './services/blizzard.service';

dotenvInit();

const {
    DISCORD_BOT_TOKEN,
    BLIZZARD_AUTH_TOKEN,
} = process.env;

const blizzardService = new BlizzardService(BLIZZARD_AUTH_TOKEN);


const start = async () => {
    blizzardService.start();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const discordClient = new DiscordService(
        DISCORD_BOT_TOKEN,
        blizzardService
    );
};

start().catch(err => {
    console.error(err);
    process.exit(1);
});
