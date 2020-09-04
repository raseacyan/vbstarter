const fetch = require('node-fetch');
const firebase = require("firebase-admin");
const express = require('express');
const ejs = require("ejs"),
const body_parser = require('body-parser'),
const { uuid } = require('uuidv4'),
const {format} = require('util'),
const multer  = require('multer'), 

const ViberBot  = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
const RichMediaMessage = require('viber-bot').Message.RichMedia;



const app = express(); 

app.get('/test',function(req,res){    
    res.send('your app is up and running');
});




//firebase initialize
firebase.initializeApp({
  credential: firebase.credential.cert({
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "project_id": process.env.FIREBASE_PROJECT_ID,
  }),
  databaseURL: "https://fir-b7a51.firebaseio.com"
});

let db = firebase.firestore(); 




// Creating the bot with access token, name and avatar
const bot = new ViberBot({
    authToken: process.env.AUTH_TOKEN, // <--- Paste your token here
    name: "To Do App",  // <--- Your bot name here
    avatar: "http://api.adorable.io/avatar/200/isitup" // It is recommended to be 720x720, and no more than 100kb.
});

if (process.env.NOW_URL || process.env.HEROKU_URL) {
    const http = require('http');
    const port = process.env.PORT || 8080;

    http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(process.env.NOW_URL || process.env.HEROKU_URL));
} else {
    logger.debug('Could not find the now.sh/Heroku environment variables. Please make sure you followed readme guide.');
}


bot.onSubscribe(response => {
    say(response, `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`);
});


bot.onTextMessage(/^hi|hello$/i, (message, response) =>
    response.send(new TextMessage(`Hi there ${response.userProfile.name}. I am robot`)));

bot.onTextMessage(/^hi|hello$/i, (message, response) =>
    response.send(new TextMessage(`Hi there ${response.userProfile.name}. I am robot`)));

bot.onTextMessage(/^delete:/i, (message, response) => {    
    let taskId = message.text.slice(7);
    deleteTask(taskId, response);
});

bot.onTextMessage(/./, (message, response) => {
    const text = message.text.toLowerCase();
    
    switch(text){
        case "view":
            viewTasks(response);
            break;        
        case "who am i":
            whoAmI(message, response);
            break;
        case "new":
        case "add":
            addTask(message, response);
            break;
        default:
            if(addNewTask){
                saveTask(message, response);
            }else{
                unknownCommand(message, response);
            }
                
            
    }
});


/*
bot.onTextMessage(/view/, (message, response) => {
   viewTasks(message, response);  
});*/

const whoAmI = (message, response) => {
    response.send(new TextMessage(`Hello ${response.userProfile.name}! It's so nice to meet you`));
}

function unknownCommand(message, response){
    response.send(new TextMessage(`I don't quite understand your command`)).then(()=>{
                return response.send(new TextMessage(`To view tasks, type 'view'`)).then(()=>{
                   return response.send(new TextMessage(`To add new task, type 'new'`)).then(()=>{
                    return response.send(new TextMessage(`If you forget who you are, type 'who am i'`));
                   }); 
                });
            });
}


function addTask(message, response){
    response.send(new TextMessage(`Enter new task`));
    addNewTask = true;

}

function saveTask(message, response){       


        db.collection('Tasks').add({
           
            details:message.text
            
          }).then(success => {  
            addNewTask = false;           
            response.send(new TextMessage(`Great! You have added new task`)).then(()=>{
            viewTasks(response);
        });   
          }).catch(error => {
            console.log(error);
      });   



          
}

function viewTasks(response){

    db.collection('Tasks').get()
  .then((snapshot) => {
    var arr = [];

    snapshot.forEach((doc) => {  
           const img = {
                    "Columns":6,
                    "Rows":5,
                    "ActionType":"none",           
                    "Image":"https://store-images.s-microsoft.com/image/apps.49795.13510798887304077.4ce9da47-503d-4e6e-9fb3-2e78a99788db.b6188938-8471-4170-83b8-7fc4d9d8af6a?mode=scale&q=90&h=270&w=270&background=%230078D7"
            };
            const body = {
                "Columns":6,
                "Rows":1,
                "Text": doc.data().details,
                "ActionType":"none",
                "TextSize":"medium",
                "TextVAlign":"middle",
                "TextHAlign":"left"
            };
            const cta = {
                "Columns":6,
                "Rows":1,
                "ActionType":"reply",
                "ActionBody": "delete:"+doc.id,
                "Text":"delete",
                "TextSize":"large",
                "TextVAlign":"middle",
                "TextHAlign":"middle",
                
            }
            
            arr.push(img);
            arr.push(body);
            arr.push(cta);     
    });

    

    const SAMPLE_RICH_MEDIA = {
            "ButtonsGroupColumns": 6,
            "ButtonsGroupRows": 7,
            "BgColor": "#FFFFFF",
            "Buttons": arr,
            };

            response.send(new RichMediaMessage(SAMPLE_RICH_MEDIA)); 
  })
  .catch((err) => {
    console.log('Error getting documents', err);
  });

        
}

function deleteTask(taskId, response){  
  db.collection('Tasks').doc(taskId).delete().then(()=>{
    notifyDelete(response);
  });      
  
  
}

function notifyDelete(response){
   response.send(new TextMessage(`Task has been deleted`)).then(()=>{
    viewTasks(response);
   });
}