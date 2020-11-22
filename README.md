# clock-team-bot
A simple Discord bot that gathers information from a particular Google spreadsheet and performs digit calculations from selected cells.

# Import
Download the files and ```npm install``` it.

Go to the official Google Sheets API guide and click the blue button to be able to create a new project and authomatically enable the Google Sheets API.
Also, save the file (download) ```credentials.json```. 
https://developers.google.com/sheets/api/quickstart/nodejs

 - Extract ```client_secret```, ```client_id```, ```redirect_uris``` data from the file and import them to our ```.env``` file,

like this: ```CLIENT_SECRET = 1K4JkfpmylGGDXbWZZ4oyIWq```

 - Get your Discord bot token here: https://discord.com/developers/applications/YOUR_BOT/bot and import it to the ```.env``` file

 - Get your Google Spreadsheet ID from the string: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/ and import it to the ```.env``` file

 - Choose your desired cells range to let the bot calculate them. Import it to the ```.env``` file, like this: ```GOOGLE_SPREADSHEET_RANGE = E2:I100```.
   My application checks if worker presents in the cell and calculates their salary
 
 - With MongoDB (https://www.mongodb.com/) database, go to their site, sign up and create a cluster to be able to connect the database.
   Click the button 'connect', choose application and import the URI string (Node.js) to our ```.env``` file,
   like this: ```MONGO_DB = mongodb+srv://name:pass@cluster0.xxwun.azure.mongodb.net/database_name?retryWrites=true&w=majority```
 
 # Usage
 
 ```npm start``` to start the application (our bot).
 - Get your ```client_id``` here: https://discord.com/developers/applications /YOUR_BOT/, go to https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot
  and invite the bot to your servers
  
 - DM your application with ```!channel <channel_id>``` to add the channel to your database and allow the bot to handle the commands from there (besides DM)
 
 - DM your application with ```!booster <their_name>``` to add the worker to your database and allow the bot to handle the commands from available channels (besides DM)
 
 - DM your application or type to the available channel to execute the command ```!check <name>```. Bot will start calculating and answer you either in DM or channel.
