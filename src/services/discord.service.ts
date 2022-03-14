import { BlizzardService } from './blizzard.service';
import { UserRepository } from '../repositories/user.repository';
import { Channel, Client, DMChannel, TextChannel, User } from 'discord.js';
import { BotCommands, discordBotTagChannels, BotResponses } from '../lib/config';
import { consoleLog, getRegionFromText, isStringIncluded } from '../lib/utils';
import { subscribeWord } from '../lib/regexps';
import { DiscordBotError, ErrorCode } from '../errors';

export class DiscordService {
    private _discordClient: Client;
    private _token: string;
    private _blizzardService: BlizzardService;
    private _subscribers: UserRepository;
    private _subscribeTask: NodeJS.Timer;

    constructor(
        token: string,
        blizzardService: BlizzardService
    ) {
        this._discordClient = new Client();
        this._token = token;
        this._blizzardService = blizzardService;
        this._subscribers = new UserRepository();
        this.messageHandler();
    }

    start = async () => {
        await this._discordClient
            .login(this._token)
            .then(() => {
                consoleLog(`${this._discordClient.user.username} is ready`);
            });
    };

    private messageHandler = () => {
        this._discordClient.on('message', async message => {
            if (message.author.bot) {
                return;
            }

            const channel = message.channel;

            if (channel.type === 'text') {
                if (
                    discordBotTagChannels.includes(channel.id) &&
                    message.mentions.has(this._discordClient.user.id)
                ) {
                    this.reply(
                        `<@${message.author.id}> Не тагай меня, пес`,
                        channel
                    );
                }
            } else if (message.channel.type === 'dm') {
                const { content, author } = message;

                consoleLog(`Received a DM from ${author.username}: ${content}`);
                try {
                    if (content.startsWith('!')) {
                        const msgChunks = content.split(' ');
                        const command = msgChunks[0];

                        if (isStringIncluded(BotCommands, command)) {
                            switch (command) {
                                case BotCommands.CHECK: {
                                    const character = msgChunks
                                        .filter(chunk => chunk.includes('-'))[0];
                                    const allKeysFlag = msgChunks
                                        .filter(chunk => chunk.match(/all/i))[0];
                                    const nickname = character.split('-')[0].toUpperCase();
                                    const realm = character.split('-')[1].toUpperCase();
                                    const region = getRegionFromText(msgChunks);

                                    const characterRIO = await this._blizzardService
                                        .getRIO(
                                            nickname,
                                            realm,
                                            region
                                        );

                                    if (characterRIO.error) {
                                        throw new DiscordBotError(
                                            ErrorCode.FETCH_ERROR,
                                            characterRIO.error
                                        );
                                    }

                                    const keys = allKeysFlag ?
                                        characterRIO.mythic_plus_recent_runs :
                                        characterRIO.mythic_plus_recent_runs.filter(
                                            (key: any) => key.mythic_level >= 20
                                        );

                                    const response: string[] = [];
                                    keys.map((key: any) => {
                                        const keyName: string = key.short_name;
                                        const keyLevel: string = key.mythic_level;
                                        const keyUpgrades: string = key.num_keystone_upgrades;
                                        const keyUrl: string = key.url;
                                        const keyDate = new Date(key.completed_at).toUTCString();
                                        response.push(
                                            `${keyName}: ${keyLevel} (+${keyUpgrades})` +
                                            `- ${keyDate}, url: <${keyUrl}>`
                                        );
                                    });

                                    this.reply(
                                        response.length > 0 ?
                                            JSON.stringify(response, null, 2) :
                                            BotResponses.NO_KEYS,
                                        author
                                    );
                                    break;
                                }

                                case BotCommands.REALMS: {
                                    const region = getRegionFromText(msgChunks);
                                    const curDate = new Date();
                                    const curDay = curDate.getDay();
                                    const curHours = curDate.getHours();

                                    if (
                                        (region === 'us' && curDay !== 2 && curHours < 17) ||
                                        (region === 'eu' && curDay !== 3 && curHours < 4)
                                    ) {
                                        this.reply(
                                            BotResponses.REALMS_UP,
                                            author
                                        );
                                        return;
                                    }
                                    let realmName = msgChunks
                                        .filter(
                                            chunk =>
                                                chunk !== region &&
                                                chunk !== command &&
                                                !chunk.match(subscribeWord)
                                        )[0];
                                    realmName = realmName ?
                                        realmName :
                                        region === 'eu' ?
                                            'kazzak' :
                                            'illidan';

                                    const subscribe = msgChunks
                                        .filter(chunk => chunk.match(subscribeWord))[0];

                                    const realmData = await this._blizzardService
                                        .getRealm(region, realmName);

                                    const realmLink: string = realmData.connected_realm.href;

                                    const realm = await this._blizzardService
                                        .getConnectedRealm({ link: realmLink });

                                    if (realmData?.code >= 400 || realm?.code >= 400) {
                                        console.error(realm.detail);
                                        throw new DiscordBotError(
                                            ErrorCode.FETCH_ERROR,
                                            BotResponses.BAD_DATA
                                        );
                                    }
                                    const status = realm.status.type;

                                    if (subscribe && status === 'DOWN') {
                                        this._subscribers.add(author);

                                        this.reply(
                                            (this._subscribers.has(author) ?
                                                BotResponses.ALREADY_SUBBED :
                                                BotResponses.SUBBED),
                                            author
                                        );

                                        if (!this._subscribeTask?.hasRef()) {
                                            this._subscribeTask = setInterval(async () => {
                                                const server = await this._blizzardService
                                                    .getConnectedRealm({ link: realmLink });

                                                if (server.status.type === 'UP') {
                                                    clearInterval(this._subscribeTask);

                                                    if (this._subscribers.users.size !== 0) {
                                                        this.reply(
                                                            BotResponses.REALMS_UP,
                                                            this._subscribers.users
                                                        );
                                                    }
                                                } else {
                                                    consoleLog(BotResponses.REALMS_DOWN);
                                                }
                                            }, 60000);
                                        }
                                    } else {
                                        this.reply(
                                            BotResponses.REALMS_UP,
                                            author
                                        );
                                    }
                                    break;
                                }

                                case BotCommands.TOKEN: {
                                    const region = getRegionFromText(msgChunks);

                                    const token = await this._blizzardService
                                        .getGameToken(region);

                                    if (token?.code >= 400) {
                                        console.error(token.detail);
                                        throw new DiscordBotError(
                                            ErrorCode.FETCH_ERROR,
                                            BotResponses.SOMETHING_WRONG
                                        );
                                    }

                                    const price: number = token.price;
                                    const priceToStr: string = price
                                        .toString()
                                        .substring(0, 6);
                                    this.reply(
                                        `Token price is: ${priceToStr} gold`,
                                        author
                                    );
                                    break;
                                }

                                case BotCommands.COMMANDS: {
                                    this.reply(
                                        BotResponses.COMMANDS_LIST,
                                        author
                                    );
                                    break;
                                }

                                case BotCommands.AUCTION: {
                                    this.reply(
                                        'This feature is being developed',
                                        author
                                    );
                                    break;
                                    // const region = getRegionFromText(msgChunks);
                                    // let realmName = msgChunks
                                    //     .filter(
                                    //         chunk =>
                                    //             chunk !== region &&
                                    //             chunk !== command
                                    //     )[0];
                                    // realmName = realmName ?
                                    //     realmName :
                                    //     region === 'eu' ?
                                    //         'kazzak' :
                                    //         'illidan';

                                    // const realmData = await this._blizzardService
                                    //     .getRealm(region, realmName);

                                    // const realmLink: string = realmData.connected_realm.href;

                                    // const realm = await this._blizzardService
                                    //     .getConnectedRealm({ link: realmLink });

                                    // const auctionLink: string = realm.auctions.href;
                                    // const items = [];

                                    // this._blizzardService
                                    //     .getConnectedRealm({ link: auctionLink })
                                    //     .then((res: any) => {
                                    //         const auctions: any[] = res.auctions;
                                    //         items.push(auctions.filter(item =>
                                    //             item.item.id === 190626 ||
                                    //             item.item.id === 190627
                                    //         ));
                                    //     });
                                }

                                default: {
                                    this.reply(
                                        BotResponses.COMMAND_NOT_RECOGNIZED,
                                        author
                                    );
                                    break;
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error(err);

                    if (err instanceof DiscordBotError) {
                        switch (err.code) {
                            case ErrorCode.FETCH_ERROR: {
                                this.reply(
                                    (err.message ?
                                        err.message :
                                        BotResponses.BAD_DATA),
                                    author
                                );
                                break;
                            }

                            case ErrorCode.NOT_FOUND: {
                                this.reply('NOT FOUND', author);
                                break;
                            }

                            default: {
                                this.reply(BotResponses.SOMETHING_WRONG, author);
                                break;
                            }
                        }
                    } else {
                        this.reply(BotResponses.SOMETHING_WRONG, author);
                    }
                }
            }
        });
    };

    private reply = (message: string, where: TextChannel | DMChannel | User | Set<User>) => {
        if (where instanceof Channel) {
            const channel = this._discordClient
                .channels
                .cache
                .get(where.id);

            (<TextChannel | DMChannel>channel).send(message);
        } else if (where instanceof Set) {
            where.forEach(user => {
                this.getUser(user).send(message);
            });
        } else {
            this.getUser(where).send(message);
        }
        consoleLog(`ANSWERED: ${message}`);
    };

    private getUser = (user: User) =>
        this._discordClient
            .users
            .cache
            .get(user.id);
}
