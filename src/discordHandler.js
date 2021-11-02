const Discord = require('discord.js');
const discordBot = new Discord.Client();
const utils = require('./utils/utils');
const checkServerStatus = require('./checkServerStatus');
const checkCharacter = require('./checkCharacter');

require('dotenv').config();
discordBot.login(process.env.DISCORD_BOT_TOKEN);
discordBot.once('ready', () => console.log(new Date().getSeconds(), discordBot.user.username, 'ready'));

let taskMap = [];

const setCheckServerTask = (index, time, status, response, to) => {
    taskMap[index] = setInterval(() => {
        if (status === 'UP') {
            utils.DiscordBotReplyToUser(discordBot, response, to);
            if (taskMap[index]) clearInterval(taskMap[index]);
        }
    }, time);
};

discordBot.on('message', async message => {
    if (message.author.bot) return;
    if (message.channel.type === 'text' && message.channel.id === process.env.DISCORD_USERS.OVER) {
        try {
            if (message.mentions.users.size != 0) {
                message.mentions.users.map(user => {
                    if (user.id === discordBot.user.id) {
                        utils.DiscordBotReplyToChannel(discordBot, `@${message.author.username} Не тагай меня, пес`, message.channel.id);
                    }
                });
            } else if (message.mentions.roles.size != 0) {
                message.mentions.roles.map(role => {
                    if (role.id === discordBot.user.id) {
                        utils.DiscordBotReplyToChannel(discordBot, `@${message.author.username} Не тагай меня, пес`, message.channel.id);
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }
    } else if (message.channel.type === 'dm') {
        let content = message.content;
        console.log('Received a DM from ' + message.author.username + ': ' + content);

        if (content.startsWith('!')) {
            try {
                let splittedMsg = content.split(' ');

                if (splittedMsg[0] === '!check') {
                    let username = splittedMsg[1].split('-')[0];
                    let server = splittedMsg[1].split('-')[1];
                    let allKeysFlag = splittedMsg.includes('all');
                    let region = splittedMsg.includes('eu');

                    let character = await checkCharacter(username, server, region ? 'eu' : 'us');
                    let recentKeys = character.mythic_plus_recent_runs;

                    let runs = allKeysFlag ? recentKeys : recentKeys.filter(key => key.mythic_level >= 20);
                    let response = [];
                    runs.map(run => response.push(`${run.short_name}: ${run.mythic_level} - ${new Date(run.completed_at).toUTCString()}`));

                    utils.DiscordBotReplyToUser(
                        discordBot,
                        response.length > 0 ? JSON.stringify(response, null, 2) : 'No recent 20+ keys found',
                        message.author.id
                    );
                } else if (splittedMsg[0] === '!realms') {
                    let region = splittedMsg[1] ? splittedMsg[1].toLowerCase() : 'us';
                    let currentDate = new Date();

                    if ((region == 'us' && currentDate.getDay() != 2) || (region == 'eu' && currentDate.getDay() != 3)) {
                        utils.DiscordBotReplyToUser(discordBot, 'Realms are UP', message.author.id);
                    } else {
                        let realm = splittedMsg[2] ? splittedMsg[2].toLowerCase() : 'illidan';
                        let subscribe = splittedMsg.includes('subscribe');

                        let serverData = await utils.checkServer(region, realm);
                        let server = await checkServerStatus(region, serverData.id);

                        if (!subscribe) {
                            utils.DiscordBotReplyToUser(discordBot, server.realms[0].slug.toUpperCase() + ' status is ' + server.status.type, message.author.id);
                        } else {
                            utils.DiscordBotReplyToUser(discordBot, 'Started to check the server every minute, will ping you if server is up.', message.author.id);
                            setCheckServerTask(0, 6000, server.status.type, server.realms[0].slug.toUpperCase() + ' status is ' + server.status.type, message.author.id);
                        }

                        if (server.status.type === 'UP' && taskMap[0]) {
                            utils.DiscordBotReplyToUser(discordBot, realm.toUpperCase() + ' is up...', message.author.id);
                            clearInterval(taskMap[0]);
                        };
                    }
                }
            } catch (e) {
                console.error(e);
                utils.DiscordBotReplyToUser(discordBot, 'Something went wrong...', message.author.id);
            }
        }
    }
});

module.exports = discordBot;