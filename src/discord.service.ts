import { Client, DMChannel, NewsChannel, TextChannel, User } from "discord.js";
import { commands, responses } from './lib/config';
import FetchBlizzardService from "./fetchBlizzard.service";
import TaskService from './task.service';
import { consoleLog } from "./lib/utils";

export default class DiscordService {
    private _discordClient: Client;
    private _token: string;
    private _fetchBlizzardService: FetchBlizzardService;
    private _subscribeListeners: User[];
    private _taskService: TaskService;
    private _tagChannels: string[];

    constructor(discordClient: Client, token: string, blizzardToken: string, tagChannels: string[]) {
        this._discordClient = discordClient;
        this._token = token;
        this._fetchBlizzardService = new FetchBlizzardService(blizzardToken);
        this._tagChannels = tagChannels;
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
            if (msg.channel.type === 'text' &&
                this._tagChannels.includes(channel.id)
            ) {

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
                const { content, author } = msg;

                consoleLog('Received a DM from ' + author.username + ': ' + content);

                // for commands, start with !
                if (content.startsWith('!')) {
                    const splitMsg = content.split(' ');
                    const command = splitMsg[0];

                    if (Object.values(commands).includes(command)) {
                        if (command === commands.CHECK) {
                            const fullChar = splitMsg[1];
                            const username = fullChar.split('-')[0].toUpperCase();
                            const server = fullChar.split('-')[1].toUpperCase();
                            const allKeysFlag = splitMsg.includes('all') || splitMsg.includes('ALL');
                            const region = splitMsg.includes('eu') || splitMsg.includes('EU');

                            const character = await this._fetchBlizzardService.fetchRIO(
                                username,
                                server,
                                region ? 'eu' : 'us'
                            );
                            if (character.error) {
                                this.replyToUser(
                                    character.message,
                                    author
                                );
                                console.log(character.message);
                            } else {
                                const recentKeys: [] = character.mythic_plus_recent_runs;
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
                                        responses.NO_KEYS,
                                    author
                                );
                            }
                        } else if (command === commands.REALMS) {
                            const region = splitMsg.includes('eu') || splitMsg.includes('EU') ? 'eu' : 'us';
                            const indOfReg = splitMsg.indexOf(region);
                            if (indOfReg != -1) splitMsg.splice(indOfReg, 1);

                            const currDate = new Date();

                            // if it's not the reset day or reset hours
                            if ((region == 'us' && currDate.getDay() != 2 && currDate.getHours() < 17) ||
                                (region == 'eu' && currDate.getDay() != 3 && currDate.getHours() < 4)
                            ) {
                                this.replyToUser(
                                    responses.REALMS_UP,
                                    author
                                );
                            } else {
                                let realm = splitMsg
                                    .filter(msg => msg != splitMsg[0] && msg != 'subscribe')
                                    .toString();

                                if (!realm) {
                                    realm = (/eu/i).test(region) ? 'kazzak' : 'illidan';
                                }

                                const subscribe = splitMsg.includes('subscribe');
                                const realmData = await this._fetchBlizzardService
                                    .fetchRealmData(region, realm);
                                const realmStatus = await this._fetchBlizzardService
                                    .fetchRealmStatus(region, realmData.id);

                                if (realmStatus && realmStatus.code >= 400) {
                                    consoleLog(realmStatus.detail);
                                    this.replyToUser(
                                        responses.SOMETHING_WRONG,
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
                                                responses.ALREADY_SUBBED,
                                                author
                                            );
                                        } else {
                                            this.replyToUser(
                                                responses.SUB_RESPONSE,
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
                        } else if (command === commands.TOKEN) {
                            const filterRegion = splitMsg.filter(msg => msg.match(/(eu|us)/i));
                            const region = filterRegion[0] ? filterRegion[0] : 'us';

                            const token = await this._fetchBlizzardService.fetchGameToken(region);
                            if (token.error) {
                                this.replyToUser(
                                    responses.SOMETHING_WRONG,
                                    author
                                );
                            } else {
                                const price: number = token.price;
                                this.replyToUser(
                                    `Token price is: ${price.toString().substring(0, 6)} gold`,
                                    author
                                );
                            }
                        }
                    } else {
                        this.replyToUser(
                            responses.NOT_RECOGNIZED,
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

        consoleLog('ANSWERED: ' + message);
    };

    replyToUser = (message: string, user: User) => {
        const userId = user.id;

        this._discordClient
            .users
            .cache
            .get(userId)
            .send(message);

        consoleLog('ANSWERED: ' + message);
    };
};