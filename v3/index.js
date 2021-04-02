// CamelBot typed by jkcoxson
// Why do people say written? This ain't the 80's.
// Rip fortran

const { Client } = require("discord.js");

// Import other peoples' code, kinda like stealing.
let Discord;
let fs;
let net;
let client
let pluginManager;
// High quality laziness right here. Got em.
const minecraft = "minecraft";
const stdio = "console";
const discord = "discord";
const all = "all"

try {
    Discord = require("discord.js");
    fs = require('fs');
    net = require('net'); 
    client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
}catch(error){
    console.log("npm modules were not imported, try running the installer in this directory.")
    console.log(error)
    process.exitCode = 1;
}


// Let's make some variables


// Import local objects
let logger;
try {
    let toSend = new require('./logger')
    logger=new(toSend)
}catch(error){
    console.log("Unable to initialize logger, please make sure you have the full package before running.");
    console.log(error)
    process.exitCode = 1;
}
let basement;
let games;
let plugins
try {
    basement = require('./basement.js')
    games = require('./games.js')
    plugins = require('./plugman')
}catch(error){
    logger.errout("Unable to import modules, make sure you have the full package before running.",stdio)
    logger.log(error,stdio)
    process.exitCode = 1;
}
let database
try {
    database = require('./configs/database.json')
} catch (error) {
    logger.errout("Database not loaded, creating a new one.",stdio)
    let toSend = []
    fs.writeFileSync("./configs/database.json",JSON.stringify(toSend))
    try {
        database = ('./configs/database.json')
    }catch(error){
        logger.errout("An error has occured, make sure you have appropriate priveledges.",stdio)
        logger.log(error,stdio)
        process.exitCode = 1;
    }
} 


let dprivate;
try {
    dprivate = require('./configs/private.json')
}catch (error){
    logger.errout("Private key not detected, place your key in ./configs/private.json",stdio)
    logger.log(error,stdio)
    let toSend = {
        "token":"Paste your key here"
    }
    fs.writeFileSync("./configs/private.json",JSON.stringify(toSend))
    process.exitCode = 1;
    process.exit();
}

client.login(dprivate.token).catch((error)=>{
    logger.errout("Unable to initialize bot, check your key and connection.\n",stdio)
    logger.log(error,stdio)
});
basements = [];
client.on("ready",()=>{
    let toSend=[]
    client.guilds.cache.forEach(element => {
        toSend.push(element)
    });
    for (let i = 0; i<toSend.length;i++){
        basements.push(new basement(client,toSend[i],logger))
        basements[i].on("error",(err)=>{
            console.log("The basement module has returned an error: "+err+"\nCamelBot will not work correctly and will probably crash. Good luck!")
        });
    }
    pluginManager = new plugins("put something here later",logger)
});

logger.on('stdin',async (command,args)=>{
    logger.feedback(await(commandRunner(command,args,stdio)).catch((err)=>{
        logger.errout(err)
    }))
});

// Now that that's out of the way, time to get going.
// I am programming on an iPad, is that even legal? I don't know but it's pretty nice.

/**
 * Run all functions here for simplicity.
 * @param {string} command
 * @param {Array} args
 * @param {string} source
 * @param {Client} context
 * @returns {Promise}
 */

async function commandRunner(command,args,source,context=null){
    return new Promise((resolve,reject)=>{
        let commandResolved = false
        switch(command){
            case "help":
                resolve("Ha ha no.")
                break;
            case "plshelp":
                let toSend=""
                toSend+="############################################################\n"
                toSend+=hashWrap(source+" commands",60)+"\n"
                toSend+="############################################################\n"
                toSend+=hashWrap("help: Get rejected like I do all the time",60)+"\n"
                toSend+=hashWrap("plshelp: Show this help menu",60)+"\n"
                toSend+="############################################################\n"

                resolve(toSend)
                break;
            default:
                reject(("Command not found: "+command))
                break;
        }
    });
}

function hashWrap(input,hashLength){
    let sideHash = (hashLength-(input.length+10))/2;
    let toSend=""
    for (let i = 0; i<sideHash; i++){
        toSend+="#"
    }
    toSend+="     "+input+"     ";
    let wierdo = false;
    if (!Number.isInteger(sideHash)){
        wierdo=true
    }
    if (wierdo){
        for (let i = 0; i<sideHash-1; i++){
        toSend+="#"
    }
    }else{
        for (let i = 0; i<sideHash; i++){
            toSend+="#"
        }
    }
    
    return(toSend)
}

