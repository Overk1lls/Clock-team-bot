const Discord = require('discord.js');
const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const TOKEN_PATH = 'token.json';

require('dotenv').config();

const bot = new Discord.Client();

const client_secret = process.env.CLIENT_SECRET;
const client_id = process.env.CLIENT_ID;
const redirect_uris = process.env.REDIRECT_URIS;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// channels list
const channels = [ '', '' ];
// boosters list
const boosters = [ '', '', '', '', '', '', '' ];

function setToken() {
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            getNewToken(oAuth2Client);
            setToken();
        }
        oAuth2Client.setCredentials(JSON.parse(token));
    })
}

function getNewToken(oAuth2Client) {
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
          if (err) return console.error(err);
          console.log('Token stored to: ', TOKEN_PATH);
        });
      });
    });
}

function accessSpreadsheet(message, auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    let salary = 0;
    
    sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SPREADSHEET, range: 'E2:I100', majorDimension: 'ROWS' }, (err, res) => {
        if (err) return console.log('THE API RETURNED: ' + err);

        const rows = res.data.values;
        if (rows.length) {
            rows.map((row) => {
                if (row != '') {
                    var boosters = row[0].split(" ");
                    for (var i = 0; i < 4; i++) {
                        if (boosters[i] && boosters[i].toUpperCase() === message.content.toUpperCase()) {
                            if (row[4]) salary += parseInt(row[4]);
                        }
                    }
                }
            });
            
            sendSalary(message, salary);
        } else {
            console.log("NO DATA FOUND");
        }
    });
    
}

function sendSalary(message, salary) {
    let response = `${message.content.toUpperCase()}'s salary: ${salary}`;

    if (!message.guild) {
        message.author.send(response);
    } else bot.channels.cache.get(message.channel.id).send(response);
}

bot.once('ready', () => {
    setToken();
    console.log('ready');
});

bot.on('message', (message) => {
    if (!message.author.bot)
        console.log('Received a message: ' + message.content + (message.guild ? `, guild: ${message.guild.name}, channel: ${message.channel.name}` : `, author: ${message.author.username}`));
    else return;
    if (channels.includes(message.channel.id) || !message.guild) {
        if (boosters.includes(message.content.toUpperCase())) {
            accessSpreadsheet(message, oAuth2Client);
        }
    }
});

bot.login(process.env.DISCORD_BOT_TOKEN);

module.exports = bot;