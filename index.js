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
//const mconfig = require("./configs/minecraft.json");


//Let's make some variables
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const prefix = dconfig.prefix;
const { waitForDebugger } = require("inspector");
var droneship = require('./droneships.js')


var server_connections = []
var server_names = []
var logchats = []

// Initiate all server connections
for (var i =0; i<serverlist.length;i++){
    server_connections.push(new droneship(serverlist[i].port,serverlist[i].address,serverlist[i].name,serverlist[i].log_channel))
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
    //Don't respond to other bots
    if(message.author.bot) return;

    //If it's a command, do command stuff
    if (message.content.startsWith(dconfig.prefix)){
        //Make sure it's in the right channel, or destroy it.
        if (message.channel.id==dconfig.commandchannel){
            const commandBody = message.content.slice(prefix.length); // Remove the prefix
            const args = commandBody.split(' '); // Split the message into array
            const command = args.shift().toLowerCase(); // Remove first from command and lower all 
            if (command=="players"){
                message.reply(await(getPlayers()));
            }
            if (command=="dump"){
                // IDK if this will make it to production, it should just work in theory
            }
            if (command=="restart"){
                if (!message.member.roles.cache.some((role) => role.name === dconfig.admin)){
                    message.reply("you must be an admin to restart a server.")
                    return;
                }
                if (args.length<1){
                    message.reply("you must supply the name of the server to restart");
                    return;
                }
                for (var i =0; i<server_connections.length;i++){
                    if (server_connections[i].connected&&server_connections[i].server_name==args[0]){
                        var packet = {
                            "type":"restart"
                        }
                        server_connections[i].send(JSON.stringify(packet))
                        message.reply("sent restart packet to "+server_connections[i].server_name)
                    }
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
            server_connections[i].send(JSON.stringify(toSend))
        }
    }
});

for (var i = 0; i<server_connections.length; i++){
    server_connections[i].on('chat', (sender, message,source) => {
        for(var p = 0; p<server_connections.length;p++){
            if (server_connections[p].server_name!=source&&server_connections[p].connected){
                var chatpack = {
                    "type":"command",
                    "command": tellRaw(sender, message)
                }
                server_connections[p].send(JSON.stringify(chatpack))
            }
            
        }
        
        client.channels.cache.get(dconfig.minecraftchat).send("**"+sender+":** "+message);
    });
    server_connections[i].on('log', (log,channel)=>{
        if (log.length>0){
            if (log.length>1999){
                var pieces = Math.ceil(log/1999)
                for (var p = 0; p<pieces-1;p++){
                    client.channels.cache.get(channel).send(log.splice(i*1999,i+1*1999)); 
                }
            }else{
                client.channels.cache.get(channel).send(log); 
            }
        }
        
    })
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









client.on("ready", () =>{
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







