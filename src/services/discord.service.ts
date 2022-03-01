import { BlizzardService } from "./blizzard.service";
import { UserRepository } from "../repositories/user.repository";
import { Channel, Client, DMChannel, TextChannel, User } from "discord.js";
import { botCommands, discordBotTagChannels, BotResponses } from '../lib/config';
import { consoleLog, getRegionFromText } from "../lib/utils";

export class DiscordService {
    private _discordClient: Client;
    private _token: string;
    private _blizzardService: BlizzardService;
    private _subscribers: UserRepository;
    private _subscribeTask: NodeJS.Timer;

    constructor(
        discordClient: Client,
        token: string,
        blizzardService: BlizzardService
    ) {
        this._discordClient = discordClient;
        this._token = token;
        this._blizzardService = blizzardService;
        this._subscribers = new UserRepository();
        this.messageHandler();
    }

    start = async () => {
        await this._discordClient
            .login(this._token)
            .then(async () => {
                consoleLog(
                    `${this._discordClient.user.username} is ready`
                );
            });
    };

    private messageHandler = () => {
        this._discordClient.on('message', async msg => {
            if (msg.author.bot) {
                return;
            }

            const channel = msg.channel;

            if (channel.type === 'text') {
                if (
                    discordBotTagChannels.includes(channel.id) &&
                    msg.mentions.has(this._discordClient.user.id)
                ) {
                    this.reply(
                        `<@${msg.author.id}> Не тагай меня, пес`,
                        channel
                    );
                }
            } else if (msg.channel.type === 'dm') {
                const { content: message, author } = msg;

                consoleLog(`Received a DM from ${author.username}: ${message}`);

                if (message.startsWith('!')) {
                    const msgChunks = message.split(' ');
                    const command = msgChunks[0];

                    if (Object.values(botCommands).includes(command)) {
                        if (command === botCommands.CHECK) {
                            const character = msgChunks[1];
                            const username = character.split('-')[0].toUpperCase();
                            const server = character.split('-')[1].toUpperCase();
                            const showAll = msgChunks.filter(chunk => chunk.match(/all/i))[0];
                            const region = getRegionFromText(msgChunks);

                            const characterRIO = await this
                                ._blizzardService
                                .fetchRIO(
                                    username,
                                    server,
                                    region
                                );

                            if (characterRIO.error) {
                                this.reply(
                                    BotResponses.SOMETHING_WRONG,
                                    author
                                );
                                consoleLog(characterRIO.message)
                            } else {
                                const recentKeys: any[] = characterRIO.mythic_plus_recent_runs;
                                const keys = showAll ?
                                    recentKeys :
                                    recentKeys.filter(
                                        key => key.mythic_level >= 20
                                    );

                                let response: string[] = [];
                                keys.map(key => {
                                    response.push(
                                        `${key.short_name}: ${key.mythic_level} (+${key.num_keystone_upgrades}) - ${new Date(key.completed_at).toUTCString()}, url: <${key.url}>`
                                    );
                                });

                                this.reply(
                                    response.length > 0 ?
                                        JSON.stringify(response, null, 2) :
                                        BotResponses.NO_KEYS,
                                    author
                                );
                            }
                        } else if (command === botCommands.REALMS) {
                            const region = getRegionFromText(msgChunks);
                            const currDate = new Date();

                            if (
                                (region === 'us' && currDate.getDay() != 2 && currDate.getHours() < 17) ||
                                (region === 'eu' && currDate.getDay() != 3 && currDate.getHours() < 4)
                            ) {
                                this.reply(
                                    BotResponses.REALMS_UP,
                                    author
                                );
                            } else {
                                const realmName = region.toLocaleLowerCase() === 'eu' ?
                                    'kazzak' :
                                    'illidan';

                                const subscribe = msgChunks.filter(chunk => chunk.match(/subscribe/i))[0];

                                const realmData = await this._blizzardService
                                    .fetchRealmData(region, realmName);
                                const realm = await this._blizzardService
                                    .fetchRealm(region, realmData.id);

                                if (realm && realm.code >= 400) {
                                    consoleLog(realm.detail);
                                    this.reply(
                                        BotResponses.SOMETHING_WRONG,
                                        author
                                    );
                                } else {
                                    const status = realm.status.type;

                                    if (!subscribe || status === 'UP') {
                                        this.reply(
                                            `${realmData.slug.toUpperCase()} server status is ${status}`,
                                            author
                                        );
                                    } else {
                                        if (this._subscribers.has(author)) {
                                            this.reply(
                                                BotResponses.ALREADY_SUBBED,
                                                author
                                            );
                                        } else {
                                            this._subscribers.push(author);

                                            this.reply(
                                                BotResponses.SUBBED,
                                                author
                                            );
                                        }

                                        if (!this._subscribeTask?.hasRef()) {
                                            this._subscribeTask = setInterval(async () => {
                                                const server = await this
                                                    ._blizzardService
                                                    .fetchRealm(
                                                        realmName,
                                                        realmData.id
                                                    );

                                                if (server.status.type === 'UP') {
                                                    clearInterval(this._subscribeTask);

                                                    if (this._subscribers.users.length !== 0) {
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
                                    }
                                }
                            }
                        } else if (command === botCommands.TOKEN) {
                            const region = getRegionFromText(msgChunks);

                            const token = await this._blizzardService.fetchGameToken(region);

                            if (token.error) {
                                this.reply(
                                    BotResponses.SOMETHING_WRONG,
                                    author
                                );
                                consoleLog(token);
                            } else {
                                const price: number = token.price;
                                this.reply(
                                    `Token price is: ${price.toString().substring(0, 6)} gold`,
                                    author
                                );
                            }
                        } else if (command === botCommands.COMMANDS) {
                            this.reply(
                                BotResponses.COMMANDS_LIST,
                                author
                            );
                        }
                    } else {
                        this.reply(
                            BotResponses.COMMAND_NOT_RECOGNIZED,
                            author
                        );
                    }
                }
            }
        });
    };

    private reply = (message: string, where: TextChannel | DMChannel | User | User[]) => {
        if (where instanceof Channel) {
            const channel = this._discordClient
                .channels
                .cache
                .get(where.id);

            (<TextChannel | DMChannel>channel).send(message);
        } else {
            if (where instanceof Array) {
                where.forEach(user => {
                    this.getUser(user).send(message);
                });
            } else {
                this.getUser(where).send(message);
            }
        }
        consoleLog(`ANSWERED: ${message}`);
    };

    private getUser = (user: User) => {
        return this._discordClient
            .users
            .cache
            .get(user.id);
    };
};