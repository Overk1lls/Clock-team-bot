const fetchBlizzardToken = require('./src/fetchBlizzardToken');
require('./src/discordHandler');

async function start() {
    await fetchBlizzardToken();
}

start();