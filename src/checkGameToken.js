const fetch = require('node-fetch');

module.exports = async (region, taskMap, callback) => {
    await fetch(`https://${region}.api.blizzard.com/data/wow/token/index?&namespace=dynamic-us`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + process.env.BLIZZARD_ACCESS_TOKEN,
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(res => {
            if (res.price <= 1509990000) {
                console.log('Token price is good');
                taskMap[2].stop();
                callback('@here WoW US token price is good (150k)!', '672667309906853899');
            }
        })
        .catch(async err => {
            console.log('error: ' + err);
            await fetch('https://us.battle.net/oauth/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic YTY1NTVkODM4ZTNhNGI4ZmIwOGI4ZGJjYWJkZDZlMTk6MXg1TXRITDBkRGpmTTgyclh0Tk5IdVJXOHNtYlpROWk=',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            }).then(res => res.json()).then(res => process.env.BLIZZARD_ACCESS_TOKEN = res.access_token);
        });
};