const fetch = require('node-fetch');

const fetchBlizzardToken = async () => {
    await fetch('https://us.battle.net/oauth/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + process.env.BLIZZARD_AUTH_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    })
        .then(res => res.json())
        .then(res => process.env.BLIZZARD_ACCESS_TOKEN = res.access_token)
        .catch(e => console.error(e));
};

module.exports = fetchBlizzardToken;