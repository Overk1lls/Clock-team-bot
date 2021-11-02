const cron = require('node-cron');
const fetch = require('node-fetch');

let targetItems = [186356, 186358, 186364, 186367];

// module.exports = (server) => {
//     cron.schedule('* * * * *', async () => {
//         await fetch(`https://us.api.blizzard.com/data/wow/connected-realm/${server}/auctions?&namespace=dynamic-us`, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${process.env.BLIZZARD_ACCESS_TOKEN}`,
//                 'Content-Type': 'application/json'
//             }
//         })
//             .then(res => res.json())
//             .then(res => {
//                 res.auctions.map(item => {
//                     if (targetItems.includes(item.id)) {
//                         console.log('works');
//                     }
//                 });
//             })
//             .catch(async err => {
//                 console.log('err: ' + err);
//                 await fetch('https://us.battle.net/oauth/token', {
//                     method: 'POST',
//                     headers: {
//                         'Authorization': 'Basic YTY1NTVkODM4ZTNhNGI4ZmIwOGI4ZGJjYWJkZDZlMTk6MXg1TXRITDBkRGpmTTgyclh0Tk5IdVJXOHNtYlpROWk=',
//                         'Content-Type': 'application/x-www-form-urlencoded'
//                     },
//                     body: 'grant_type=client_credentials'
//                 }).then(res => res.json()).then(res => process.env.BLIZZARD_ACCESS_TOKEN = res.access_token);
//             });
//     });
// };

module.exports = async (region, server, startingItem) => {
    return await fetch(`https://${region}.api.blizzard.com/data/wow/connected-realm/${server}/auctions?&namespace=dynamic-${region}&orderby=id&_pageSize=1000&id=[${startingItem},]&_page=1`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.BLIZZARD_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json());
};