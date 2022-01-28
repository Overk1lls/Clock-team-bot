"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./lib/config");
const fetchBlizzard_service_1 = __importDefault(require("./fetchBlizzard.service"));
const task_service_1 = __importDefault(require("./task.service"));
const utils_1 = require("./lib/utils");
class DiscordService {
    constructor(discordClient, token, blizzardToken) {
        this.start = () => {
            this._discordClient
                .login(this._token)
                .then(() => {
                (0, utils_1.consoleLog)(this._discordClient.user.username + ' is ready');
            });
        };
        this.messageHandler = () => {
            this._discordClient.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
                if (msg.author.bot)
                    return;
                // if message written in a channel
                if (msg.channel.type === 'text' &&
                    config_1.discordBotTagChannels.includes(msg.channel.id)) {
                    const channel = msg.channel;
                    if (msg.mentions.users.size != 0) {
                        msg.mentions.users.map(user => {
                            if (user.id === this._discordClient.user.id) {
                                this.replyToChannel(`<@${msg.author.id}> Не тагай меня, пес`, channel);
                            }
                        });
                    }
                }
                else if (msg.channel.type === 'dm') {
                    // if DM to the bot
                    const { content, author } = msg;
                    const currDate = new Date();
                    console.log(currDate.getHours() + ':' +
                        currDate.getMinutes() + ':' +
                        currDate.getSeconds(), 'Received a DM from ' +
                        author.username + ': ' +
                        content);
                    // for commands, start with !
                    if (content.startsWith('!')) {
                        const splitMsg = content.split(' ');
                        const command = splitMsg[0];
                        if (Object.values(config_1.commands).includes(command)) {
                            if (command === config_1.commands.CHECK) {
                                const fullChar = splitMsg[1];
                                const username = fullChar.split('-')[0].toUpperCase();
                                const server = fullChar.split('-')[1].toUpperCase();
                                const allKeysFlag = splitMsg.includes('all') || splitMsg.includes('ALL');
                                const region = splitMsg.includes('eu') || splitMsg.includes('EU');
                                const character = yield this._fetchBlizzardService.fetchRIO(username, server, region ? 'eu' : 'us');
                                if (character.error) {
                                    this.replyToUser(character.message, author);
                                    console.log(character.message);
                                }
                                else {
                                    const recentKeys = character.mythic_plus_recent_runs;
                                    const runs = allKeysFlag ? recentKeys : recentKeys.filter((key) => key.mythic_level >= 20);
                                    let response = [];
                                    runs.map((run) => {
                                        response.push(`${run.short_name}: ${run.mythic_level} (+${run.num_keystone_upgrades}) - ${new Date(run.completed_at).toUTCString()}, url: <${run.url}>`);
                                    });
                                    this.replyToUser(response.length > 0 ?
                                        JSON.stringify(response, null, 2) :
                                        config_1.responses.NO_KEYS, author);
                                }
                            }
                            else if (command === config_1.commands.REALMS) {
                                const region = splitMsg.includes('eu') || splitMsg.includes('EU') ? 'eu' : 'us';
                                const indOfReg = splitMsg.indexOf(region);
                                if (indOfReg != -1)
                                    splitMsg.splice(indOfReg, 1);
                                // if it's not the reset day or reset hours
                                if ((region == 'us' && currDate.getDay() != 2 && currDate.getHours() < 17) ||
                                    (region == 'eu' && currDate.getDay() != 3 && currDate.getHours() < 4)) {
                                    this.replyToUser(config_1.responses.REALMS_UP, author);
                                }
                                else {
                                    let realm = splitMsg
                                        .filter(msg => msg != splitMsg[0] && msg != 'subscribe')
                                        .toString();
                                    if (!realm) {
                                        realm = (/eu/i).test(region) ? 'kazzak' : 'illidan';
                                    }
                                    const subscribe = splitMsg.includes('subscribe');
                                    const realmData = yield this._fetchBlizzardService
                                        .fetchRealmData(region, realm);
                                    console.log(realmData);
                                    const realmStatus = yield this._fetchBlizzardService
                                        .fetchRealmStatus(region, realmData.id);
                                    if (realmStatus && realmStatus.code >= 400) {
                                        (0, utils_1.consoleLog)(realmStatus.detail);
                                        this.replyToUser(config_1.responses.SOMETHING_WRONG, author);
                                    }
                                    else {
                                        const status = realmStatus.status.type;
                                        if (!subscribe || status === 'UP') {
                                            this.replyToUser(`${realmData.slug.toUpperCase()} server status is ${status}`, author);
                                        }
                                        else {
                                            if (this._subscribeListeners.includes(author)) {
                                                this.replyToUser(config_1.responses.ALREADY_SUBBED, author);
                                            }
                                            else {
                                                this.replyToUser(config_1.responses.SUB_RESPONSE, author);
                                            }
                                            this._subscribeListeners.push(author);
                                            if (!this._taskService.ifBusy) {
                                                this._taskService = new task_service_1.default(60000, this._fetchBlizzardService.fetchRealmStatus, [region, realmData.id]);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            this.replyToUser(config_1.responses.NOT_RECOGNIZED, author);
                        }
                    }
                }
            }));
        };
        this.replyToChannel = (message, channel) => {
            const channelId = channel.id;
            const responseChannel = this._discordClient
                .channels
                .cache
                .get(channelId);
            responseChannel.send(message);
            (0, utils_1.consoleLog)('ANSWERED: ' + message);
        };
        this.replyToUser = (message, user) => {
            const userId = user.id;
            this._discordClient
                .users
                .cache
                .get(userId)
                .send(message);
            (0, utils_1.consoleLog)('ANSWERED: ' + message);
        };
        this._discordClient = discordClient;
        this._token = token;
        this._fetchBlizzardService = new fetchBlizzard_service_1.default(blizzardToken);
        this.messageHandler();
    }
}
exports.default = DiscordService;
;
