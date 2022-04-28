import { User } from 'discord.js';
import { BotResponse } from '../../lib/config';
import { DiscordService } from '.';
import { DiscordBotError, ErrorCode } from '../error.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = (error: any, bot: DiscordService, author: User) => {
    console.error(error);

    const reply = (message: string) => bot.reply(message, author);

    if (error instanceof DiscordBotError) {
        switch (error.code) {
            case ErrorCode.FETCH_ERROR: {
                reply(error.message ?? BotResponse.BAD_DATA);
                break;
            }

            case ErrorCode.NOT_FOUND: {
                reply(ErrorCode.NOT_FOUND);
                break;
            }

            default: {
                reply(BotResponse.SOMETHING_WRONG);
                break;
            }
        }
    } else {
        reply(BotResponse.SOMETHING_WRONG);
    }
};
