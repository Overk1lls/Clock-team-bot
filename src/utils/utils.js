const fetch = require('node-fetch');

function DiscordBotReplyToChannel(discordBot, message, channel) {
    discordBot.channels.cache.get(channel.toString()).send(message);
}

function DiscordBotReplyToUser(discordBot, message, user) {
    console.log('Answered to user ' + discordBot.users.cache.get(user).username + ': ' + message);
    discordBot.users.cache.get(user.toString()).send(message);
}

const checkServer = async (region, server) => {
    return await fetch(`https://${region}.api.blizzard.com/data/wow/realm/${server}?namespace=dynamic-${region}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.BLIZZARD_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .catch(async error => {
            console.log('server fetch error: ' + error.message);

            await fetch('https://us.battle.net/oauth/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic YTY1NTVkODM4ZTNhNGI4ZmIwOGI4ZGJjYWJkZDZlMTk6MXg1TXRITDBkRGpmTTgyclh0Tk5IdVJXOHNtYlpROWk=',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            })
                .then(res => res.json())
                .then(res => process.env.BLIZZARD_ACCESS_TOKEN = res.access_token)
                .catch(e => console.log('fetch token error: ' + e.message));
        });
};

module.exports = {
    DiscordBotReplyToChannel,
    DiscordBotReplyToUser,
    checkServer
};