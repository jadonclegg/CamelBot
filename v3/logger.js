// Log module built for CamelBot
// Authored by jkcoxson
// Long live camels

const { EventEmitter } = require('events');
const minecraft = "minecraft";
const stdio = "console";
const discord = "discord";
const fs = require('fs');
const all = "all"
let date = new Date();
// Hopefully it's hot ^
let colors = require('colors')

let loopback;
let lastCommand;
let logName;
let logFile = "";


module.exports = class logger extends EventEmitter {
    constructor(client) {
        super();
        loopback=this;
        var readline = require('readline');
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });
        // Create a log file
        logName = date.getDay()+"-"+date.getMonth()+"-"+date.getFullYear()+"-"+date.getHours()+":"+date.getMinutes()+"-CamelBot-Log.txt"
        logFile += "[System Startup at "+date.getHours()+":"+date.getMinutes()+"]\n"
        fs.writeFile("./logs/"+logName,logFile,(err)=>{
            
        });
        this.log("CamelBot command line tools have arrived, type plshelp for help or help to be rejected",stdio);
        rl.on('line', function(line){
            loopback.online(line)
        });

    }
    online(line){
        if (line==lastCommand){
            return;
        }
        lastCommand=line;
        let args = line.split(' ');
        let command = args[0];
        args.splice(0,1);
        this.emit('stdin',command,args);
        //process.stdout.write("> ");
    }
    /**
     * Logs to the desired log output.
     * @param {string} toSend Message of what to send
     * @param {string} destination Discord/stdio
     * @param {string} channel Discord channel to send in
     * @param {string} client Pass in Discord client
     */
    log(toSend,destination=all,channel=null,client=null){
        
        if (destination==stdio){
            logFile+="["+date.getDay()+"-"+date.getMonth()+"-"+date.getFullYear()+"-"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]  "+toSend+"\n"
            fs.writeFile("./logs/"+logName,logFile,(err)=>{

            });
            process.stdout.write(toSend+"\n> ");
        }
        if (destination==discord){
            client.channels.cache.get(channel).send(toSend)
        }
    }
    feedback(toSend){
        if(toSend==undefined){
            return;
        }
        process.stdout.write(toSend+"\n> ");
        lastCommand="";
    }
    errout(toSend){
        logFile+="["+date.getDay()+"-"+date.getMonth()+"-"+date.getFullYear()+"-"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]  "+toSend+"\n"
        fs.writeFile("./logs/"+logName,logFile,(err)=>{
            
        });
        process.stdout.write((toSend.red).bold+"\n> ");
        lastCommand=""
    }
}