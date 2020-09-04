const fetch = require('node-fetch');
const firebase = require("firebase-admin");
const express = require('express');
const ejs = require("ejs");
const body_parser = require('body-parser');
const { uuid } = require('uuidv4');
const {format} = require('util');
const multer  = require('multer');

const ViberBot  = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
const RichMediaMessage = require('viber-bot').Message.RichMedia;



const app = express(); 

app.get('/',function(req,res){    
    res.send('your app is up and running');
});

app.get('/test',function(req,res){    
    res.send('test');
});




//firebase initialize
firebase.initializeApp({
  credential: firebase.credential.cert({
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "project_id": process.env.FIREBASE_PROJECT_ID,
  }),
  databaseURL:process.env.FIREBASE_DB_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

let db = firebase.firestore(); 




// Creating the bot with access token, name and avatar
const bot = new ViberBot({
    authToken: process.env.AUTH_TOKEN, // <--- Paste your token here
    name: "Viber Bot",  // <--- Your bot name here
    avatar: "http://api.adorable.io/avatar/200/isitup" // It is recommended to be 720x720, and no more than 100kb.
});

app.use("/viber/webhook", bot.middleware());

app.listen(process.env.PORT || 8080, () => {
    console.log(`webhook is listening`);
    bot.setWebhook(`${process.env.APP_URL}/viber/webhook`).catch(error => {
        console.log('Can not set webhook on following server. Is it running?');
        console.error(error);
        process.exit(1);
    });
});
 





bot.onSubscribe(response => {
    say(response, `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`);
});


bot.onTextMessage(/^hi|hello$/i, (message, response) =>
    response.send(new TextMessage(`Hi there ${response.userProfile.name}. I am robot`)));



bot.onTextMessage(/./, (message, response) => {

    const text = message.text.toLowerCase();

    console.log('MESSAGE:', message);
    
    switch(text){
        case "text":
            textDemo(message, response);
            break; 
        case "rich media":
            richMediaDemo(message, response);
            break;             
        case "who am i":
            whoAmI(message, response);
            break;       
        default:
            defaultReply(message, response);
            
                
            
    }
});


/*
bot.onTextMessage(/view/, (message, response) => {
   viewTasks(message, response);  
});*/

const whoAmI = (message, response) => {
    response.send(new TextMessage(`Hello ${response.userProfile.name}! It's so nice to meet you`));
}

const textDemo = (message, response) => {
    let message = "Here is sample text message";
    response.send(new TextMessage(message));
}

const textDemo = (message, response) => {
    let message = "Here is sample text message";
    response.send(new TextMessage(message));
}

function defaultReply(message, response){
    response.send(new TextMessage(`I don't quite understand your command`)).then(()=>{
                return response.send(new TextMessage(`Another line of text`)).then(()=>{
                   return response.send(new TextMessage(`Another another line of text`)).then(()=>{
                    return response.send(new TextMessage(`If you forget who you are, type 'who am i'`));
                   }); 
                });
            });
}


