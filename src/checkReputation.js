const fetch = require('node-fetch');
const cron = require('node-cron');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('dotenv').config();

const characterSchema = new Schema({
    character: { type: String, required: true },
    fraction: { type: String, required: true },
    reputation: [
        { name: String, value: Number, valueMax: String, valueName: String, tier: Number },
        { name: String, value: Number, valueMax: String, valueName: String, tier: Number }
    ]
});
const Character = mongoose.model('Character', characterSchema);

exports.Character = Character;
exports.checkReputation = character => {
    cron.schedule('*/10 * * * * *', async () => {
        let char = character.split('-')[0];
        let server = character.split('-')[1];

        await fetch(`https://us.api.blizzard.com/profile/wow/character/${server}/${char}/reputations?namespace=profile-us&locale=en_US`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.BLIZZARD_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(res => {
                let archivistsCodex;
                let deathAdvance;

                res.reputations.map(item => {
                    if (item.faction.name === "The Archivists' Codex")
                        archivistsCodex = {
                            name: item.faction.name,
                            value: item.standing.value,
                            valueMax: item.standing.max,
                            valueName: item.standing.name,
                            tier: item.standing.tier
                        };
                    else if (item.faction.name === "Death's Advance")
                        deathAdvance = {
                            name: item.faction.name,
                            value: item.standing.value,
                            valueMax: item.standing.max,
                            valueName: item.standing.name,
                            tier: item.standing.tier
                        };
                });

                Character.findOne({ character: char }, (err, foundChar) => {
                    if (err) console.error(err);
                    // console.log('this: ' + mongoose.connection.readyState);
                    // if (archivistsCodex != null && archivistsCodex.tier > foundChar.reputation[0].tier && archivistsCodex.tier < 7) {
                    //     DiscordBotReply(`${foundChar.character.toUpperCase()} has reached new ${archivistsCodex.name} reputation tier! (${archivistsCodex.tier}) EZ`, discordChannelsID.clockTeam);
                    //     foundChar.reputation[0].valueMax = archivistsCodex.valueName;
                    //     foundChar.reputation[0].tier = archivistsCodex.tier;
                    // }
                    // if (deathAdvance != null && deathAdvance.tier > foundChar.reputation[1].tier && deathAdvance.tier < 7) {
                    //     DiscordBotReply(`${foundChar.character.toUpperCase()} has reached new ${deathAdvance.name} reputation tier! (${deathAdvance.tier}) EZ`, discordChannelsID.clockTeam);
                    //     foundChar.reputation[1].valueMax = deathAdvance.valueName;
                    //     foundChar.reputation[1].tier = deathAdvance.tier;
                    // }

                    // if (archivistsCodex != null && archivistsCodex.value != foundChar.reputation[0].value) foundChar.reputation[0].value = archivistsCodex.value;
                    // if (deathAdvance != null && deathAdvance.value != foundChar.reputation[1].value) foundChar.reputation[1].value = deathAdvance.value;
                });
                // let DBCount = await DB.collection('users').findOne({ character: char });
                // if (!DBCount) {
                //     let fraction;

                //     if (server === 'illidan' || server === 'tichondrius' || server === 'area-52') fraction = 'horde';
                //     else fraction = 'ally';

                //     let user = {
                //         character: char,
                //         fraction: fraction,
                //         reputation: [
                //             archivistsCodex,
                //             deathAdvance
                //         ]
                //     };
                //     await DB.collection('users').insertOne(user);
                // } else {
                //     let DBChar = await DB.collection('users').findOne({ character: char });

                //     if (archivistsCodex != null && archivistsCodex.tier > DBChar.reputation[0].tier && archivistsCodex.tier < 7) {
                //         DiscordBotReply(`${char.toUpperCase()} has reached new ${archivistsCodex.name} reputation tier! (${archivistsCodex.tier}) EZ`, discordChannelsID.clockTeam);
                //         DBChar.reputation[0].valueMax = archivistsCodex.valueName;
                //         DBChar.reputation[0].tier = archivistsCodex.tier;
                //     }
                //     if (deathAdvance != null && deathAdvance.tier > DBChar.reputation[1].tier && deathAdvance.tier < 7) {
                //         DiscordBotReply(`${char.toUpperCase()} has reached new ${deathAdvance.name} reputation tier! (${deathAdvance.tier}) EZ`, discordChannelsID.clockTeam);
                //         DBChar.reputation[1].valueMax = deathAdvance.valueName;
                //         DBChar.reputation[1].tier = deathAdvance.tier;
                //     }

                //     if (archivistsCodex != null && archivistsCodex.value != DBChar.reputation[0].value) DBChar.reputation[0].value = archivistsCodex.value;
                //     if (deathAdvance != null && deathAdvance.value != DBChar.reputation[1].value) DBChar.reputation[1].value = deathAdvance.value;

                //     await DB.collection('users').updateOne({ character: char }, {
                //         $set: {
                //             reputation: DBChar.reputation
                //         }
                //     }, { upsert: true });
                // }

                // if (archivistsCodex != null && deathAdvance != null)
                //     console.log(char.toUpperCase() + ': (' + (archivistsCodex.tier < 5 ?
                //         archivistsCodex.name + ' ' + archivistsCodex.value + '/' + archivistsCodex.valueMax : 'full') +
                //         '); ' + (deathAdvance.tier < 7 ? deathAdvance.name + ': (' + deathAdvance.value + '/' + deathAdvance.valueMax + ')' : 'full'));
                // else console.log(`${char.toUpperCase()}: ZERO REPUTATION`);
            })
            .catch(err => {
                console.error(err);
                fetch('https://us.battle.net/oauth/token', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Basic YTY1NTVkODM4ZTNhNGI4ZmIwOGI4ZGJjYWJkZDZlMTk6MXg1TXRITDBkRGpmTTgyclh0Tk5IdVJXOHNtYlpROWk=',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: 'grant_type=client_credentials'
                }).then(res => res.json()).then(res => {
                    process.env.BLIZZARD_ACCESS_TOKEN = res.access_token;
                });
            });
    });
};