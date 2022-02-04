import { Client, DMChannel, NewsChannel, TextChannel, User } from "discord.js";
import { COMMANDS, RESPONSES, SHEETS_INDEXES } from './lib/config';
import { consoleLog } from "./lib/utils";
import FetchBlizzardService from "./fetchBlizzard.service";
import TaskService from './task.service';
import GoogleSheetService from "./googleSheet.service";

export default class DiscordService {
    private _discordClient: Client;
    private _token: string;
    private _fetchBlizzardService: FetchBlizzardService;
    private _subscribeListeners: User[];
    private _taskService: TaskService;
    private _tagChannels: string[];
    private _googleSheetService: GoogleSheetService;

    constructor(
        discordClient: Client,
        token: string,
        blizzardToken: string,
        tagChannels: string[],
        googleSheetService: GoogleSheetService
    ) {
        this._discordClient = discordClient;
        this._token = token;
        this._fetchBlizzardService = new FetchBlizzardService(blizzardToken);
        this._tagChannels = tagChannels;
        this._googleSheetService = googleSheetService;
        this.messageHandler();
    }

    start = async () => {
        await this._discordClient
            .login(this._token)
            .then(async () => {
                consoleLog(this._discordClient.user.username + ' is ready');
            });
    };

    private messageHandler = () => {
        this._discordClient.on('message', async msg => {
            if (msg.author.bot) return;

            const channel = msg.channel;

            // if message written in a channel
            if (msg.channel.type === 'text' && this._tagChannels.includes(channel.id)) {
                if (msg.mentions.users.size != 0) {
                    msg.mentions.users.map(user => {
                        if (user.id === this._discordClient.user.id) {
                            this.replyToChannel(
                                `<@${msg.author.id}> Не тагай меня, пес`,
                                channel
                            );
                        }
                    });
                }
            } else if (msg.channel.type === 'dm') {
                // if DM to the bot
                const { content: message, author } = msg;

                consoleLog('Received a DM from ' + author.username + ': ' + message);

                // for commands, start with !
                if (message.startsWith('!')) {
                    const splitMsg = message.split(' ');
                    const command = splitMsg[0];

                    if (Object.values(COMMANDS).includes(command)) {
                        if (command === COMMANDS.CHECK) {
                            const character = splitMsg[1];
                            const username = character.split('-')[0].toUpperCase();
                            const server = character.split('-')[1].toUpperCase();
                            const allKeysFlag = splitMsg.filter(msg => msg.match(/all/i))[0];
                            const region = splitMsg.filter(msg => msg.match(/eu|us/i))[0];

                            const fetchCharacter = await this._fetchBlizzardService.fetchRIO(
                                username,
                                server,
                                region
                            );
                            if (fetchCharacter.error) {
                                this.replyToUser(
                                    fetchCharacter.message,
                                    author
                                );
                                console.log(fetchCharacter.message);
                            } else {
                                const recentKeys: [] = fetchCharacter.mythic_plus_recent_runs;
                                const runs = allKeysFlag ? recentKeys : recentKeys.filter(
                                    (key: any) => key.mythic_level >= 20
                                );

                                let response: string[] = [];
                                runs.map((run: any) => {
                                    response.push(
                                        `${run.short_name}: ${run.mythic_level} (+${run.num_keystone_upgrades}) - ${new Date(run.completed_at).toUTCString()}, url: <${run.url}>`
                                    );
                                });

                                this.replyToUser(
                                    response.length > 0 ?
                                        JSON.stringify(response, null, 2) :
                                        RESPONSES.NO_KEYS,
                                    author
                                );
                            }
                        } else if (command === COMMANDS.REALMS) {
                            const region = splitMsg.includes('eu') || splitMsg.includes('EU') ? 'eu' : 'us';
                            const indOfReg = splitMsg.indexOf(region);
                            if (indOfReg != -1) splitMsg.splice(indOfReg, 1);

                            const currDate = new Date();

                            // if it's not the reset day or reset hours
                            if ((region == 'us' && currDate.getDay() != 2 && currDate.getHours() < 17) ||
                                (region == 'eu' && currDate.getDay() != 3 && currDate.getHours() < 4)
                            ) {
                                this.replyToUser(
                                    RESPONSES.REALMS_UP,
                                    author
                                );
                            } else {
                                let realm = splitMsg
                                    .filter(msg => msg != splitMsg[0] && msg != 'subscribe')
                                    .toString();

                                if (!realm) {
                                    realm = (/eu/i).test(region) ? 'kazzak' : 'illidan';
                                }

                                const subscribe = splitMsg.filter(chunk => chunk.match(/subscribe/i))[0];
                                const realmData = await this._fetchBlizzardService
                                    .fetchRealmData(region, realm);
                                const realmStatus = await this._fetchBlizzardService
                                    .fetchRealmStatus(region, realmData.id);

                                if (realmStatus && realmStatus.code >= 400) {
                                    consoleLog(realmStatus.detail);
                                    this.replyToUser(
                                        RESPONSES.SOMETHING_WRONG,
                                        author
                                    );
                                } else {
                                    const status = realmStatus.status.type;

                                    if (!subscribe || status === 'UP') {
                                        this.replyToUser(
                                            `${realmData.slug.toUpperCase()} server status is ${status}`,
                                            author
                                        );
                                    } else {
                                        if (this._subscribeListeners.includes(author)) {
                                            this.replyToUser(
                                                RESPONSES.ALREADY_SUBBED,
                                                author
                                            );
                                        } else {
                                            this.replyToUser(
                                                RESPONSES.SUB_RESPONSE,
                                                author
                                            );
                                        }
                                        this._subscribeListeners.push(author);

                                        if (!this._taskService.ifBusy) {
                                            this._taskService = new TaskService(
                                                60000,
                                                this._fetchBlizzardService.fetchRealmStatus,
                                                [region, realmData.id]
                                            );
                                        }
                                    }
                                }
                            }
                        } else if (command === COMMANDS.TOKEN) {
                            const filterRegion = splitMsg.filter(msg => msg.match(/eu|us/i))[0];
                            const region = filterRegion ? filterRegion : 'us';

                            const token = await this._fetchBlizzardService.fetchGameToken(region);
                            if (token.error) {
                                this.replyToUser(
                                    RESPONSES.SOMETHING_WRONG,
                                    author
                                );
                            } else {
                                const price: number = token.price;
                                this.replyToUser(
                                    `Token price is: ${price.toString().substring(0, 6)} gold`,
                                    author
                                );
                            }
                        } else if (command === COMMANDS.WISHLIST) {
                            const id = splitMsg[1];

                            if (!id.match(/\d{2,}/)) {
                                this.replyToUser(
                                    RESPONSES.NOT_RECOGNIZED,
                                    author
                                );
                            } else {
                                const filterRegion = splitMsg.filter(msg => msg.match(/eu|us/i))[0];
                                const region = filterRegion ? filterRegion : 'eu';
                                const username = splitMsg[2];
                                const priority = splitMsg[3];

                                const item = await this._fetchBlizzardService.fetchItem(region, id);

                                if (item?.error) {
                                    this.replyToUser(
                                        RESPONSES.SOMETHING_WRONG,
                                        author
                                    );
                                    consoleLog(item.error);
                                } else {
                                    const itemName = item.name.ru_RU;
                                    const sheet = this._googleSheetService.googleSheet.sheetsByIndex[SHEETS_INDEXES.WISHLIST];
                                    const rows = await sheet.getRows();

                                    const itemRowTitle = 'Предмет';
                                    const userRow = rows.filter(row => row[itemRowTitle] === itemName)[0];

                                    if (!userRow[username] || userRow[username] === '') {
                                        userRow[username] = priority;
                                        await userRow.save();
                                    } else {
                                        this.replyToUser(
                                            RESPONSES.ALREADY_PRIORITIZED,
                                            author
                                        );
                                    }
                                }
                            }
                        } else if (command === COMMANDS.COMMANDS) {
                            this.replyToUser(
                                RESPONSES.COMMANDS,
                                author
                            );
                        }
                    } else {
                        this.replyToUser(
                            RESPONSES.NOT_RECOGNIZED,
                            author
                        );
                    }
                }
            }
        });
    };

    replyToChannel = (message: string, channel: TextChannel | DMChannel | NewsChannel) => {
        const channelId = channel.id;

        const responseChannel = this._discordClient
            .channels
            .cache
            .get(channelId);

        (<TextChannel | DMChannel | NewsChannel>responseChannel).send(message);

        consoleLog('ANSWERED:\n' + message);
    };

    replyToUser = (message: string, user: User) => {
        const userId = user.id;

        this._discordClient
            .users
            .cache
            .get(userId)
            .send(message);

        consoleLog('ANSWERED:\n,' + message);
    };
};