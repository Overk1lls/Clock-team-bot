import { BlizzardService } from './blizzard.service';
import { UserRepository } from '../repositories/user.repository';
import { Channel, Client, DMChannel, TextChannel, User } from 'discord.js';
import { BotCommand, discordBotTagChannels, BotResponse } from '../lib/config';
import { logWithDate, getRegionFromText, isStringIncluded, priceToGold } from '../lib/utils';
import { subRegExp } from '../lib/regexps';
import { DiscordBotError, ErrorCode } from './error.service';
import {
    Token,
    RealmData,
    ConnectedRealm,
    IRealms,
    IAuction
} from '../interfaces/interfaces';

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
            .then(() => logWithDate(`${this._discordClient.user.username} is ready`));
    };

    private messageHandler = () => {
        this._discordClient.on('message', async message => {
            if (message.author.bot) return;

            const { channel } = message;

            if (channel.type === 'text') {
                if (discordBotTagChannels.includes(channel.id) &&
                    message.mentions.has(this._discordClient.user.id))
                    this.reply(`<@${message.author.id}> Не тагай меня, пес`, channel);
            } else if (message.channel.type === 'dm') {
                const { content, author } = message;

                logWithDate(`Received a DM from ${author.username}: ${content}`);

                try {
                    if (content.startsWith('!')) {
                        const words = content.split(' ');
                        const command = words[0];

                        if (isStringIncluded(BotCommand, command)) {
                            switch (command) {
                                case BotCommand.CHECK: {
                                    const character = words
                                        .filter(chunk => chunk.includes('-'))[0];
                                    const areAllKeys = words
                                        .filter(chunk => chunk.match(/all/i))[0];
                                    const nickname = character.split('-')[0].toUpperCase();
                                    const realm = character.split('-')[1].toUpperCase();
                                    const region = getRegionFromText(words);

                                    const characterRIO: Record<
                                        string, any // eslint-disable-line
                                    > = await this._blizzardService
                                        .getRIO(nickname, realm, region);

                                    if (characterRIO.statusCode >= 400) {
                                        throw new DiscordBotError(
                                            ErrorCode.FETCH_ERROR,
                                            characterRIO.message
                                        );
                                    }
                                    let recentKeys: unknown[] = characterRIO
                                        .mythic_plus_recent_runs;
                                    const response: string[] = [];

                                    if (!areAllKeys) {
                                        recentKeys = recentKeys
                                            .filter((key: Record<string, unknown>) =>
                                                key.mythicLevel >= 20
                                            );
                                    }
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    recentKeys.map((key: Record<string, any>) => {
                                        const {
                                            short_name: shortName,
                                            mythic_level: mythicLevel,
                                            num_keystone_upgrades: upgrades,
                                            url,
                                            completed_at: completeDate
                                        } = key;

                                        let strUpgrades = '';
                                        for (let i = 0; i < upgrades; i++) strUpgrades += '+';

                                        const date = new Date(completeDate).toUTCString();

                                        response.push(
                                            `${shortName} +${mythicLevel}` +
                                            `${strUpgrades} - ${date}, url: <${url}>`
                                        );
                                    });
                                    this.reply(
                                        response.length > 0 ?
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

                                    if ((region === 'us' && curDay !== 2 && curHours < 17) ||
                                        (region === 'eu' && curDay !== 3 && curHours < 4)
                                    ) {
                                        return this.reply(
                                            BotResponse.REALMS_UP,
                                            author
                                        );
                                    }
                                    let realmName = words
                                        .filter(chunk =>
                                            chunk !== region &&
                                            chunk !== command &&
                                            !chunk.match(subRegExp)
                                        )[0];
                                    realmName = realmName ?
                                        realmName :
                                        region === 'eu' ? 'kazzak' : 'illidan';

                                    const isSubscribed = words
                                        .filter(chunk => chunk.match(subRegExp))[0];

                                    const realmData: RealmData = await this._blizzardService
                                        .getRealm(region, realmName);

                                    const realmLink = realmData.connected_realm.href;

                                    let realm: ConnectedRealm = await this._blizzardService
                                        .getConnectedRealm({ link: realmLink });

                                    if (realmData?.code >= 400 || realm?.code >= 400) {
                                        throw new DiscordBotError(
                                            ErrorCode.FETCH_ERROR,
                                            BotResponse.BAD_DATA
                                        );
                                    }
                                    let status = realm.status.type;

                                    if (isSubscribed && status === 'DOWN') {
                                        this._subscribers.add(author);

                                        this.reply(
                                            (this._subscribers.has(author) ?
                                                BotResponse.ALREADY_SUBBED :
                                                BotResponse.SUBBED),
                                            author
                                        );

                                        if (!this._subscribeTask?.hasRef()) {
                                            this._subscribeTask = setInterval(async () => {
                                                realm = await this._blizzardService
                                                    .getConnectedRealm({ link: realmLink });
                                                status = realm.status.type;

                                                if (status === 'UP') {
                                                    clearInterval(this._subscribeTask);

                                                    if (this._subscribers.users.size !== 0) {
                                                        this.reply(
                                                            BotResponse.REALMS_UP,
                                                            this._subscribers.users
                                                        );
                                                    }
                                                } else {
                                                    logWithDate(BotResponse.REALMS_DOWN);
                                                }
                                            }, 60000);
                                        }
                                    } else this.reply(BotResponse.REALMS_UP, author);
                                    break;
                                }

                                case BotCommand.TOKEN: {
                                    const region = getRegionFromText(words);

                                    const token: Token = await this._blizzardService
                                        .getGameToken(region);

                                    if (token?.code >= 400) {
                                        throw new DiscordBotError(
                                            ErrorCode.FETCH_ERROR,
                                            BotResponse.SOMETHING_WRONG
                                        );
                                    }

                                    const { price } = token;
                                    const priceInGold = priceToGold(price);

                                    this.reply(`Token price is: ${priceInGold} gold`, author);
                                    break;
                                }

                                case BotCommand.COMMANDS: {
                                    this.reply(BotResponse.COMMANDS_LIST, author);
                                    break;
                                }

                                case BotCommand.AUCTION: {
                                    throw new DiscordBotError(
                                        ErrorCode.SERVER,
                                        'Not implemented yet'
                                    );

                                    const region = getRegionFromText(words);

                                    let realmName = words
                                        .filter(chunk =>
                                            chunk !== region &&
                                            chunk !== command
                                        )[0];

                                    realmName = realmName ?
                                        realmName :
                                        region === 'eu' ? 'kazzak' : 'illidan';

                                    const getRealm: IRealms = await this._blizzardService
                                        .getRealms(region);

                                    const { realms } = getRealm;
                                    const realmId = realms.filter(realm =>
                                        realm.name === realmName ||
                                        realm.slug === realmName
                                    )[0].id;

                                    const auction: IAuction = await this._blizzardService
                                        .getAuction({ id: realmId });
                                }

                                default: {
                                    this.reply(BotResponse.COMMAND_NOT_RECOGNIZED, author);
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
                                        BotResponse.BAD_DATA),
                                    author
                                );
                                break;
                            }

                            case ErrorCode.NOT_FOUND: {
                                this.reply('NOT FOUND', author);
                                break;
                            }

                            default: {
                                this.reply(BotResponse.SOMETHING_WRONG, author);
                                break;
                            }
                        }
                    } else this.reply(BotResponse.SOMETHING_WRONG, author);
                }
            }
        });
    };

    private reply = async (message: string, where: TextChannel | DMChannel | User | Set<User>) => {
        if (where instanceof Channel) {
            const channel = this._discordClient.channels.cache.get(where.id);
            await (<TextChannel | DMChannel>channel).send(message);
        } else if (where instanceof Set)
            where.forEach(async user => await this.getUser(user).send(message));
        else this.getUser(where).send(message);

        logWithDate(`ANSWERED: ${message}`);
    };

    private getUser = (user: User) => this._discordClient.users.cache.get(user.id);
}
