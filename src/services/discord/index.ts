import { Channel, Client, DMChannel, TextChannel, User } from 'discord.js';
import { BlizzardService } from '../blizzard.service';
import { UserRepository } from '../../repositories/user.repository';
import { BotCommand, allowedBotTagChannels, BotResponse } from '../../lib/config';
import { logWithDate, priceToGold, keyUpgradesIntoString } from '../../lib/utils';
import { subRegExp } from '../../lib/regexps';
import { DiscordBotError, ErrorCode } from '../error.service';
import { errorHandler } from './error-handler';
import { DefaultRealm, getRegionFromText } from '../../lib/realms';

export class DiscordService {
    private readonly bot: Client;
    private readonly blizzardService: BlizzardService;
    private readonly subscribers: UserRepository;
    private subscribeTask: NodeJS.Timer;

    constructor(token: string, blizzardService: BlizzardService) {
        this.bot = new Client();
        this.bot
            .login(token)
            .then(() => logWithDate(`${this.bot.user.username} is up`));

        this.subscribers = new UserRepository();

        this.blizzardService = blizzardService;

        this.messageHandler();
    }

    private messageHandler = () =>
        this.bot.on('message', async message => {
            if (message.author.bot) return;

            const { channel } = message;
            if (
                channel.type === 'text' &&
                allowedBotTagChannels.includes(channel.id) &&
                message.mentions.has(this.bot.user.id)
            ) {
                this.reply(`<@${message.author.id}> Не тагай меня, пес`, channel);
            } else if (channel.type === 'dm') {
                const { content, author } = message;

                logWithDate(`Received a DM from ${author.username}: ${content}`);
                try {
                    if (content.startsWith('!')) {
                        const words = content.split(' ');
                        const command = words[0];

                        switch (command) {
                            case BotCommand.CHECK: {
                                const character = words.find(chunk => chunk.includes('-'));
                                const [nickname, realm] = character.split('-');

                                const areAllKeys = words.find(chunk => chunk.match(/all/i));

                                const region = getRegionFromText(words);

                                const characterRIO = await this.blizzardService
                                    .getRIO({ nickname, realm, region });

                                if (characterRIO.statusCode >= 400) {
                                    throw new DiscordBotError(
                                        ErrorCode.FETCH_ERROR,
                                        characterRIO.message
                                    );
                                }
                                const recentKeys = areAllKeys ?
                                    characterRIO.mythic_plus_recent_runs :
                                    characterRIO
                                        .mythic_plus_recent_runs
                                        .filter(key => key.mythic_level >= 20);

                                const response = recentKeys.map(key => {
                                    const {
                                        short_name: shortName,
                                        mythic_level: mythicLevel,
                                        num_keystone_upgrades: keyUpgrades,
                                        url,
                                        completed_at: completeDate
                                    } = key;
                                    const strKeyUps = keyUpgradesIntoString(keyUpgrades);
                                    const keyDate = new Date(completeDate).toUTCString();

                                    return (
                                        `${shortName} +${mythicLevel}` +
                                        `${strKeyUps} - ${keyDate}, url: <${url}>`
                                    );
                                });
                                this.reply(
                                    response.length ?
                                        JSON.stringify(response, null, 2) :
                                        BotResponse.NO_KEYS,
                                    author
                                );
                                break;
                            }

                            case BotCommand.REALMS: {
                                const region = getRegionFromText(words);
                                const curDate = new Date();
                                const curDay = curDate.getDay();
                                const curHours = curDate.getHours();

                                if (
                                    (region === 'us' && curDay !== 2 && curHours < 17) ||
                                    (region === 'eu' && curDay !== 3 && curHours < 4)
                                ) {
                                    return this.reply(
                                        BotResponse.REALMS_UP,
                                        author
                                    );
                                }
                                const realmName = words
                                    .find(word =>
                                        word !== region &&
                                        word !== command &&
                                        !word.match(subRegExp)
                                    ) ?? (
                                        region === 'eu' ?
                                            DefaultRealm.EU :
                                            DefaultRealm.US
                                    );

                                const isSub = words.find(word => word.match(subRegExp));

                                const realm = await this.blizzardService
                                    .getRealm(region, realmName);

                                const realmLink = realm.connected_realm.href;

                                let connectedRealm = await this.blizzardService
                                    .getConnectedRealm({ link: realmLink });

                                if (realm?.code >= 400 || connectedRealm?.code >= 400) {
                                    throw new DiscordBotError(
                                        ErrorCode.FETCH_ERROR,
                                        BotResponse.BAD_DATA
                                    );
                                }
                                let status = connectedRealm.status.type;

                                if (status === 'UP') {
                                    this.reply(BotResponse.REALMS_UP, author);
                                    return;
                                }
                                this.reply(BotResponse.REALMS_DOWN, author);

                                if (isSub) {
                                    this.subscribers.add(author);

                                    this.reply(
                                        (this.subscribers.has(author) ?
                                            BotResponse.ALREADY_SUBBED :
                                            BotResponse.SUBBED),
                                        author
                                    );

                                    if (!this.subscribeTask?.hasRef()) {
                                        this.subscribeTask = setInterval(async () => {
                                            connectedRealm = await this.blizzardService
                                                .getConnectedRealm({ link: realmLink });

                                            status = connectedRealm.status.type;

                                            if (status === 'UP') {
                                                clearInterval(this.subscribeTask);

                                                if (this.subscribers.users.size) {
                                                    this.reply(
                                                        BotResponse.REALMS_UP,
                                                        this.subscribers.users
                                                    );
                                                }
                                            } else {
                                                logWithDate(BotResponse.REALMS_DOWN);
                                            }
                                        }, 60000);
                                    }
                                }
                                break;
                            }

                            case BotCommand.TOKEN: {
                                const region = getRegionFromText(words);

                                const token = await this.blizzardService
                                    .getGameToken(region);

                                if (token?.code >= 400) {
                                    throw new DiscordBotError(
                                        ErrorCode.FETCH_ERROR,
                                        BotResponse.SOMETHING_WRONG
                                    );
                                }
                                const price = priceToGold(token.price);

                                this.reply(`Token price is: ${price} gold`, author);
                                break;
                            }

                            case BotCommand.COMMANDS: {
                                this.reply(BotResponse.COMMANDS_LIST, author);
                                break;
                            }

                            case BotCommand.AUCTION: {
                                throw new Error('Not Implemented Yet');
                                // const region = getRegionFromText(words);

                                // const realmName = words
                                //     .find(chunk =>
                                //         chunk !== region &&
                                //         chunk !== command
                                //     ) ?? (
                                //         region === 'eu' ?
                                //             DefaultRealm.EU :
                                //             DefaultRealm.US
                                //     );

                                // const servers = await this.blizzardService.getRealms(region);

                                // const { realms } = servers;
                                // const realmId = realms.find(realm =>
                                //     realm.name === realmName ||
                                //     realm.slug === realmName
                                // ).id;
                                // const auctions: unknown[] = [];

                                // this.blizzardService
                                //     .getAuction({ region, id: realmId })
                                //     .then(auction => {
                                        // const filtered = auction.auctions
                                        //     .filter(item => item.item.id === 190630);
                                //         auctions.push(...filtered);
                                //     })
                                //     .then(() => {
                                //         console.log(auctions);
                                //     });

                                // break;
                            }

                            default: {
                                this.reply(BotResponse.NO_COMMAND, author);
                                break;
                            }
                        }
                    }
                } catch (err) {
                    errorHandler(err, this, author);
                }
            }
        });

    reply = async (
        message: string,
        where: TextChannel | DMChannel | User | Set<User>
    ) => {
        if (!message.length) {
            throw new Error('Message is empty');
        }

        if (where instanceof Channel) {
            const channel = this.bot.channels.cache.get(where.id);
            await (channel as TextChannel | DMChannel).send(message);
        } else if (where instanceof Set) {
            where.forEach(async user => await this.getUserOrChannel(user).send(message));
        } else {
            await where.send(message);
        }
        logWithDate(`ANSWERED: ${message}`);
    };

    private getUserOrChannel = (user: User) => this.bot.users.cache.get(user.id);
}
