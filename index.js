const Discord = require('discord.js');
const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');
const { MongoClient } = require('mongodb');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

require('dotenv').config();

const bot = new Discord.Client();
const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URIS[0]);
let database;

async function start() {
    bot.login(process.env.DISCORD_BOT_TOKEN);

    bot.once('ready', () => {
        console.log(`${bot.user.username} ready`);
    });

    setGoogleAuthToken();

    try {
        const client = await MongoClient.connect(
            process.env.MONGO_DB,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
        database = client.db();
    } catch (err) {
        console.log(`DB Constructor error thrown: ${err}`);
        process.exit(1);
    }
}

function setGoogleAuthToken() {
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            getGoogleAuthToken(oAuth2Client);
            setGoogleAuthToken();
        }
        oAuth2Client.setCredentials(JSON.parse(token));
    });
}

function getGoogleAuthToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error while trying to retrieve access token: ', err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(`Error while trying to write access token to the file ${TOKEN_PATH}: ${err}`);
          console.log('Token stored to: ', TOKEN_PATH);
        });
      });
    });
}

function botSendToChannel(message, response) {
    return bot.channels.cache.get(message.channel.id).send(response);
}

function botSendToAuthor(message, response) {
    return message.author.send(response);
}

function calculateSalary(message, auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    let salary = 0;
    var booster = message.content.split(' ')[1];
    
    sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET,
        range: process.env.GOOGLE_SPREADSHEET_RANGE
    }, (err, res) => {
        if (err) {
            let response = 'Something went wrong. An error occurred!';
            message.guild ? botSendToChannel(message, response) : botSendToAuthor(message, response);
            return console.log(`THE GOOGLE SHEETS API RETURNED: ${err}`);
        }

        const rows = res.data.values;
        if (rows.length) {
            rows.map((row) => {
                if (row != '') {
                    var boosters = row[0].split(' ');
                    for (var i = 0; i < 4; i++) {
                        if (boosters[i] && boosters[i].toUpperCase() === booster.toUpperCase()) {
                            if (row[4]) salary += parseFloat(row[4]);
                        }
                    }
                }
            });
            let response = `${booster.toUpperCase()}'s salary is ${salary}`;
            message.guild ? botSendToChannel(message, response) : botSendToAuthor(message, response);
        } else {
            let response = 'Something went wrong. An error occurred!';
            message.guild ? botSendToChannel(message, response) : botSendToAuthor(message, response);
            return console.log('NO DATA FOUND IN THE GOOGLE SHEET');
        }
    });
}

bot.on('message', async (message) => {
    if (message.author.bot) return;
    
    try {
        let content = message.content;
        let author = message.author.username;
        let channel_id = message.channel.id;

        if (!message.guild) {
            console.log(`Received a Direct Message: ${content}, author: ${author}`);
        }

        if (content.startsWith('!booster')) {
            let booster = content.split(' ')[1];
            if (booster && booster != '') {
                if (await database.collection('boosters').findOne({ name: booster.toUpperCase() })) {
                    let response = `This booster (${booster.toUpperCase()}) already exists in the database`;
                    return message.guild ? botSendToChannel(message, response) : botSendToAuthor(message, response);
                }
                let newBooster = {
                    name: `${booster.toUpperCase()}`,
                    author: `${author}`
                };
                await database.collection('boosters').insertOne(newBooster);
            }
        } else if (content.startsWith('!channel')) {
            let channel = message.content.split(' ')[1];
            if (channel && channel != '') {
                if (await database.collection('channels').findOne({ id: channel_id })) {
                    let response = `This channel (${channel}) already exists in the database`;
                    return message.guild ? botSendToChannel(message, response) : botSendToAuthor(message, response);
                }
                let newChannel = {
                    id: `${channel_id}`,
                    name: `${bot.channels.cache.get(channel).name}`,
                    guild: `${bot.channels.cache.get(channel).guild}`,
                    author: `${author}`
                }
                await database.collection('channels').insertOne(newChannel);
            }
        } else if (content.startsWith('!check')) {
            let booster = message.content.split(' ')[1];
            if (booster && booster != '') {
                if (await database.collection('boosters').findOne({ name: booster.toUpperCase() })) {
                    calculateSalary(message, oAuth2Client);
                } else {
                    let response = `Booster (${booster}) not found. If you want to check, add them by writing !booster nickname`;
                    return message.guild ? botSendToChannel(message, response) : botSendToAuthor(message, response);
                }
            }
        }
    } catch (err) {
        let response = 'Something went wrong. An error occurred!';
        console.log(`${response} ${message.content}`);
        message.guild ? botSendToChannel(message, response) : botSendToAuthor(message, response);
        return console.log(`An error thrown while processing the message: ${err}`);
    }
});

start();