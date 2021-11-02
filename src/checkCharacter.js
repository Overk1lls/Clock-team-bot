const fetch = require('node-fetch');
const utils = require('./utils/utils');

module.exports = (character, server, region = 'us', fields = 'mythic_plus_recent_runs') => {
    return fetch(`https://raider.io/api/v1/characters/profile?region=${region}&realm=${server}&name=${character}&fields=${fields}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .catch(err => {
            console.log('character fetch error: ' + err.message);
        });
};