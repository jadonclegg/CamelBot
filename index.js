//CamelBot typed by jkcoxson
//Why do people say written? This ain't the 80's.
//Rip fortran

//Import other peoples' code, kinda like stealing.
const Discord = require("discord.js");
const fs = require('fs');
const { spawn } = require("child_process");

//Read in some values
const dprivate = require('./configs/private.json');
const dconfig = require('./configs/discord.json');
const mconfig = require("./configs/minecraft.json");


//Let's make some variables
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const prefix = dconfig.prefix;
const { waitForDebugger } = require("inspector");
const child_process = require('child_process');
var game = child_process.spawn('java', ['-Xmx4G','-Xms4G','-jar',mconfig.jarname],{cwd:mconfig.path});
var logcache=[]
var cachesize=0

//Game variables
var playersonline = [];
var serverdone = false;
var dict = [];

//Reading player data
var namereplacements = [];
fs.readFile('./data/replacements.json', function (err,data){
    namereplacements = JSON.parse(data);
});
dlog("JSON:" + namereplacements)
var joinedplayers;
fs.readFile('./data/joined.txt', (err,data)=>{
    joinedplayers = data.toString().split('\n');
});



////////////////
//DISCORD CODE//
////////////////

//Listen for people running their mouths
client.on('message', async message =>{
    //Don't respond to other bots
    if(message.author.bot) return;

    //If it's a command, do command stuff
    if (message.content.startsWith(dconfig.prefix)){
        //Make sure it's in the right channel, or destroy it.
        if (message.channel.id==dconfig.commandchannel){
            const commandBody = message.content.slice(prefix.length); // Remove the prefix
            const args = commandBody.split(' '); // Split the message into array
            const command = args.shift().toLowerCase(); // Remove first from command and lower all 
            if (command=="link"){
                if (args.length>0){
                    var topush = message.author.username
                    topush += ":";
                    topush += args[0];
                    dlog(topush)
                    dict.push(topush);
                    var tosend="Boot up Minecraft and type \"~link "+message.author.username+"\""
                    message.reply(tosend)
                }else{
                    message.reply("You must type ~link YourMinecraftUsername");
                }
                
            }
            if (command=="players"){
                var tosend = "**Players online:**\n"
                for (var i =0; i<playersonline.length;i++){
                    tosend+=playersonline[i]
                    tosend+='\n'
                }
                message.reply(tosend)

            }
            if (command=="dump"){
                dumpcache();
                message.reply("Dumped Java log early")
            }

        }else{
            message.delete();           
        }
    }

    //Get rid of crap in picture channels
    if (message.channel.id==dconfig.screenshots | message.channel.id==dconfig.memes){
        if(message.attachments.size<1){
            message.delete();
        }
    }
    //Send messages into the game if the game exists
    if (message.channel.id==dconfig.minecraftchat){
        if (serverdone){
            var sender=message.author.username
            for (var i =0; i<namereplacements.length;i++){
                if (namereplacements[i].startsWith(message.author.username)){
                    sender=namereplacements[i].split(' ')[1];
                }
            }
            var tosend = "say §l"
            tosend+=sender
            tosend+=": "
            tosend+=message.content
            tosend+='\n';
            game.stdin.write(tosend)
        }
    }
});





/////////////////
//MINCRAFT CODE//
/////////////////
game.stdout.setEncoding("utf-8");
game.stdin.setEncoding("utf-8");
game.stdout.on('data', data => {
    dlog(data.toString());
    data_str=data.toString();
    var datasplit=data_str.split(' ');
    datasplit.shift();
    if (datasplit[2]=="Done"){
        serverdone=true;
    }
    if (datasplit[2]=="delayed"){
        if (datasplit[6]=="Done"){
            serverdone=true;
        }
    }
    if (serverdone){
        //Start parsing input here
        if (datasplit[3]=='joined'){
            playersonline.push(datasplit[2]);
        }
        if (datasplit[3]=='left'){
            playersonline.splice(playersonline.findIndex(element=>element =datasplit[2],element=>element =datasplit[2]))
        }
        dlog("Players online: ")
        dlog(playersonline)
        if (datasplit[2].startsWith('<')){
            
            var chatmessage = "**"
            var sender = datasplit[2].slice(1,datasplit[2].length-1)
            if (datasplit[2].startsWith('~link')){
                dlog("Testing for link")
                var topush = datasplit[3].slice(0,datasplit[3].length-1);
                topush+=":";
                topush+=sender
                dlog(topush);
                if(dict.includes(topush)){
                    dlog("linked")
                    namereplacements.push(datasplit[3].slice(0,datasplit[3].length-1)+": "+sender)
                    fs.writeFile("./data/replacements.json", JSON.stringify(namereplacements),function(err){
                        if(err) {
                            return dlog(err);
                        }
                    });
                }
            }else{
                chatmessage+=sender;
                chatmessage+=":** "
                for(var i = 3; i<datasplit.length; i++){
                    chatmessage+=datasplit[i];
                    chatmessage+=" ";
                }
                client.channels.cache.get(dconfig.minecraftchat).send(chatmessage);
            }
            
        }
    }
    

    
});

game.on('error',err=>{
    dlog("Error");
    dlog(err)
});



function dlog(message){
    console.log(message)
    var stringified
    try{
        stringified = message.toString()
    }catch{
        
    }

    if (stringified.length>2){
        logcache.push(stringified);
    }
    cachesize+=stringified.length
    if (cachesize>1500){
        dumpcache();
    }
    
    
}
function dumpcache(){
    tosend=""
    for (var i =0;i<logcache.length;i++){
        tosend+=logcache[i];
        tosend+="\n";
    }
    client.channels.cache.get(dconfig.logchat).send(tosend)
    logcache=[]
    cachesize=0;
}



client.login(dprivate.token);