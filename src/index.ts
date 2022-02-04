import { config } from 'dotenv';
import { Client } from 'discord.js';
import { discordBotTagChannels } from './lib/config';
import { connect } from 'mongoose';
import DiscordService from './discord.service';
import GoogleSheetSevrice from './googleSheet.service';

config();

const {
    DISCORD_BOT_TOKEN,
    BLIZZARD_AUTH_TOKEN,
    MONGODB_URI,
    SPREADSHEET_ID,
    GOOGLE_SERVICE_EMAIL,
    GOOGLE_PRIVATE_KEY
} = process.env;

connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const client = new Client();
const GoogleSheetService = new GoogleSheetSevrice(SPREADSHEET_ID, GOOGLE_SERVICE_EMAIL, GOOGLE_PRIVATE_KEY);
const discordClient = new DiscordService(
    client,
    DISCORD_BOT_TOKEN,
    BLIZZARD_AUTH_TOKEN,
    discordBotTagChannels,
    GoogleSheetService
);

discordClient.start();