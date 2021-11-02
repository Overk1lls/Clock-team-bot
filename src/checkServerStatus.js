const fetch = require('node-fetch');

const checkServerStatus = async (region, realm) => {
    return await fetch(`https://${region}.api.blizzard.com/data/wow/connected-realm/${realm}?namespace=dynamic-${region}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + process.env.BLIZZARD_ACCESS_TOKEN,
            'Content-Type': 'application/json'
        },
    })
        .then(res => res.json())
        .catch(e => console.error(e));
};

module.exports = checkServerStatus;