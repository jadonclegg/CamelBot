//CamelBot typed by jkcoxson
//Why do people say written? This ain't the 80's.
//Rip fortran

//Import other peoples' code, kinda like stealing.
const Discord = require("discord.js");
const fs = require('fs');
const net = require('net');
const { spawn } = require("child_process");

//Read in some values
const dprivate = require('./configs/private.json');
const dconfig = require('./configs/discord.json');
const serverlist = require('./configs/servers.json');
var pinglist = require("./data/pings.json")
//const mconfig = require("./configs/minecraft.json");


//Let's make some variables
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const prefix = dconfig.prefix;
const { waitForDebugger } = require("inspector");
var droneship = require('./droneships.js')
var bot = require('./bots.js');
const { version } = require("canvas");
const { resolve } = require("path");


var server_connections = []
var server_names = []
var logchats = []
var dconnected = false
var unconnectedlogs = []


// Initiate all server connections
for (var i =0; i<serverlist.length;i++){
    server_connections.push(new droneship(serverlist[i].port,serverlist[i].address,serverlist[i].name,serverlist[i].log_channel,dconfig.logchat))
    logchats.push(serverlist[i].log_channel)
}

/**
 * Builds a tellraw command using the official JSON format of minecraft.
 * 
 * See https://minecraft.gamepedia.com/Commands/tellraw for more information.
 * 
 * @param {string} playerName - Name of player (plaintext)
 * @param {string} message - Message, can contain any characters.
 * @returns {string} - Text for tellraw command.
 */
function tellRaw(playerName, message) {
    let command = "tellraw @a ";
    let data = [
        {
            text: "<" + playerName + "> ",
        },
        {
            text: message
        }
    ];

    return command + JSON.stringify(data);
}


//Listen for people running their mouths
client.on('message', async message =>{
    pingAdder(message.author.username,message.author.id)
    if (message.content.startsWith("This has been an automated ghost ping for ")){
        message.delete();
        return;
    }
    //Don't respond to other bots
    if(message.author.bot) return;

    //If it's a command, do command stuff
    if (message.content.startsWith(dconfig.prefix)){
        //Make sure it's in the right channel, or destroy it.
        if (message.channel.id==dconfig.commandchannel){
            const commandBody = message.content.slice(prefix.length); // Remove the prefix
            const args = commandBody.split(' '); // Split the message into array
            const command = args.shift().toLowerCase(); // Remove first from command and lower all
            var respond = await(command_runner(command,args,'discord',message))
            if (respond!=undefined){
                try {
                    message.reply(respond)
                }catch(err){
                    //message.reply("an error has occured.")
                    console.log(err)
                }
            }
            
            

        }else{
            //message.delete();           
        }
    }

    //Get rid of crap in picture channels
    if (message.channel.id==dconfig.screenshots | message.channel.id==dconfig.memes){
        if(message.attachments.size<1){
            message.delete();
        }
    }
    //Send messages into all the games
    if (message.channel.id==dconfig.minecraftchat){
        var qdservers=[]
        for (var i =0; i<server_connections.length;i++){
            if (server_connections[i].connected==true){
                qdservers.push(server_connections[i])
            }
        }
        var chatpack = {
            "type":"command",
            "command": tellRaw(message.author.username, message.content)
        }
        for (var i =0; i<qdservers.length;i++){
            qdservers[i].send(JSON.stringify(chatpack))
        }
    }
    for (var i =0; i<server_connections.length; i++){
        if (message.channel.toString().split('#')[1].split('>')[0]==logchats[i].toString()){
            var toSend = {
                "type":"command",
                "command":message.content
            }
            if (server_connections[i].connected){
                server_connections[i].send(JSON.stringify(toSend))
            }else{
                message.reply("server not connected")
            }
            
        }
    }
});

for (var i = 0; i<server_connections.length; i++){
    server_connections[i].on('chat', (sender, message,source) => {
        if (message.startsWith(dconfig.prefix)){
            const commandBody = message.slice(prefix.length); // Remove the prefix
            const args = commandBody.split(' '); // Split the message into array
            const command = args.shift().toLowerCase(); // Remove first from command and lower all
            var toSend = {
                'type':'command',
                'command': "tellraw "+ sender+" {\"text\":\""+command_runner(command,args,'minecraft',null,sender)+"\"}"
            }
            for(var p = 0; p<server_connections.length;p++){
                if (server_connections[p].server_name==source&&server_connections[p].connected){
                    server_connections[p].send(JSON.stringify(toSend))
                }
                
            }
            return;
        }
        for(var p = 0; p<server_connections.length;p++){
            if (server_connections[p].connected){
                var chatpack = {
                    "type":"command",
                    "command": tellRaw(sender, message)
                }
                server_connections[p].send(JSON.stringify(chatpack))
            }
            
        }
        discordSend("**"+sender+":** "+pingReplacer(message,sender),dconfig.minecraftchat)
    });
    server_connections[i].on('log', (log,channel)=>{
        if (log.length>0){
            if (log.length>1999){
                var pieces = Math.ceil(log/1999)
                for (var p = 0; p<pieces-1;p++){
                    //client.channels.cache.get(channel).send(log.splice(i*1999,i+1*1999)); 
                    discordSend(log.splice(i*1999,i+1*1999),channel)
                }
            }else{
                //client.channels.cache.get(channel).send(log); 
                discordSend(log,channel)
            }
        }
        
    })
    server_connections[i].on('console.log',(data)=>{
        if (dconnected){
            //client.channels.cache.get(dconfig.logchat).send(data); 
            discordSend(data,dconfig.logchat)
        }else{
            unconnectedlogs.push(data)
        }
        console.log(data)
    });
}

async function getPlayers() {
    return new Promise((resolve,reject)=>{
        var req_packet = {
            "type":"playerList"
        }
        var toSend = "players online: "
        var qdservers=[]
        for (var i =0; i<server_connections.length;i++){
            if (server_connections[i].connected==true){
                qdservers.push(server_connections[i])
            }
        }
        
        var qdlength = qdservers.length
        for (var i=0;i<qdservers.length;i++){
            qdservers[i].send(JSON.stringify(req_packet))
            qdservers[i].on('playerlist',(plist)=>{
                for (var p =0; p<plist.length;p++){
                    if (plist[p].toString().length>0){
                        toSend+=plist[p]
                        toSend+=", "
                    }
                    
                }
                qdlength--;
                if (qdlength==0){
                    toSend=toSend.slice(0,toSend.length-2)
                    if (toSend=="players online"){
                        toSend="no players online."
                    }
                    resolve(toSend)
                }
            });
        }
        if (qdlength==0){
            resolve("no players online.")
        }
        
    })
}

async function getCoords(player=undefined){
    return new Promise((resolve,reject)=>{
        var toReq = {
            "type":"reqCoords"
        }
        var playerlist = []
        var listcount = 0;
        var qdservers=[]
        for (var i =0; i<server_connections.length;i++){
            if (server_connections[i].connected==true){
                qdservers.push(server_connections[i])
            }
        }
        var qdlength = qdservers.length
        for (var i = 0;i<qdservers.length; i++){
            if (qdservers[i].connected){
                qdservers[i].send(JSON.stringify(toReq))
            }
            qdservers[i].on('reqCoords',(list)=>{
                list.forEach(it=>{
                    playerlist.push(it)
                });
                qdlength--;
                if (qdlength<1){
                    if (player==undefined){
                        resolve(playerlist)
                    }else{
                        for (var p = 0; p<playerlist.length;p++){
                            if (playerlist[p].player==player){
                                resolve(playerlist[p])
                            }
                        }
                        resolve("player not found")
                    }
                }
            })
        }
    });
}

async function command_runner(command,args,source,message=null,player=null){
    if (command=="players"){
        if (source=='discord'){
            return(await(getPlayers()));
        }else{
            return("You must run this command from Discord")
        }
        
    }
    if (command=="restart"){
        if (source=='minecraft'){
            return("You must run this command from Discord")
        }
        if (!message.member.roles.cache.some((role) => role.name === dconfig.admin)){
            return("you must be an admin to restart a server.")
            
        }
        if (args.length<1){
            return("you must supply the name of the server to restart");
            
        }
        for (var i =0; i<server_connections.length;i++){
            if (server_connections[i].connected&&server_connections[i].server_name==args[0]){
                var packet = {
                    "type":"restart"
                }
                server_connections[i].send(JSON.stringify(packet))
                return("sent restart packet to "+server_connections[i].server_name)
            }
        }
        return("no connected server found named "+args[0])
    }
    if (command=="pingalias"){
        if(source=='discord'){
            if (args.length<1){
                return("supply the name by which you want to be called.")
            }
            for (var i = 0; i<pinglist.length; i++){
                if (pinglist[i].username==args[0]){
                    return("that nickname is already in the database.")
                }
                
            }
            var toSend = {
                "username":args[0].toString(),
                "id":message.author.id.toString()
            }
            pinglist.push(toSend)
            try {
                fs.writeFileSync("data/pings.json", JSON.stringify(pinglist))
            } catch (err) {
                console.error(err)
            }
            return(args[0]+" has been added to your database.")
        }else{
            return("You must run this command in Discord")
        }
    }
    // Broken, maybe fix later
    // if (command=="ghostping"){
        
    //     if (args.length<1){
    //         return("You must supply the name of the victim")
    //     }
    //     var victim
    //     if (source=="minecraft"){
    //         victim=pingReplacer(args[0])
    //     }else{
    //         victim=args[0]
    //         message.delete()
    //     }
        
    //     if (victim=="<@!533530255172829184> "){
    //         return("./ban")
    //     }
    //     client.channels.cache.forEach((it)=>{
    //         if (it.isText()){
    //             try{
    //                 var justSent = discordSend("This has been an automated ghost ping for "+victim+". Have a nice day!",it.id)
    //             }catch{
    //                 // Incorrect permissions
    //             }
                
    //         }
            
    //     })
             
        
        
    // }
    if (command=="here"){
        if (source!="minecraft"){
            return("you must run this command from Minecraft")
        }
        var qdservers=[]
        for (var i =0; i<server_connections.length;i++){
            if (server_connections[i].connected==true){
                qdservers.push(server_connections[i])
            }
        }
        var coord=await(getCoords(player))
        var toSend = Math.round(coord.x).toString()+" "+Math.round(coord.y).toString()+" "+Math.round(coord.z).toString()
        for (var i = 0; i<qdservers.length; i++){
            var chatpack = {
                "type":"command",
                "command": tellRaw(player, toSend)
            }
            qdservers[i].send(JSON.stringify(chatpack))
        }
        discordSend("**"+player+"**: "+coord,dconfig.minecraftchat)
        
    }
}


function pingReplacer(chat,sender){
    var brokenChat=chat.split(" ");
    var toSend = ""
    for (var i =0; i<brokenChat.length;i++){
        if (brokenChat[i].startsWith("@")){
            var found = false
            for (var p=0;p<pinglist.length;p++){
                
                if (pinglist[p].username.toString()==brokenChat[i].substr(1,brokenChat[i].length)){
                    toSend+="<@!"+pinglist[p].id+">";
                    found = true
                }
            }
            if (!found){
                toSend+=brokenChat[i]
            }
        } else{
            toSend+=brokenChat[i]
        }
        toSend+=' '
    }
    return(toSend)
}

function pingAdder(username,id){
    for (var i = 0; i<pinglist.length; i++){
        if (pinglist[i].username==username){
            return
        }
        
    }
    var toSend = {
        "username":username.toString(),
        "id":id.toString()
    }
    pinglist.push(toSend)
    try {
        fs.writeFileSync("data/pings.json", JSON.stringify(pinglist))
    } catch (err) {
        console.error(err)
    }
    
    
}

function discordSend(message,channel){
    if (message.length<1||message.length>1999){
        return;
    }
    try {
        return(client.channels.cache.get(channel).send(message));
    }catch(error){
        //console.log("Catch: "+message+" in channel: " +channel+"\n"+error)
    }
     
}





client.on("ready", () =>{
    dconnected=true
    for (var i =0; i<unconnectedlogs.length; i++){
        client.channels.cache.get(dconfig.logchat).send(unconnectedlogs[i]); 
        discordSend(unconnectedlogs[i],discordSend.logchat)
        
    }
    
        
    
    client.user.setPresence({
        status: "online",  //You can show online, idle....
        game: {
            name: dconfig.game,  //The message shown
            type: "PLAYING" //PLAYING: WATCHING: LISTENING: STREAMING:
        }
    });
    client.user.setActivity(dconfig.game); 
 });

client.login(dprivate.token);







