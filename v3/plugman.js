// This is how we do Saturday
// jkcoxson

let manifest;
let plugins = [];
const minecraft = "minecraft";
const stdio = "console";
const discord = "discord";

const { EventEmitter } = require('events');

module.exports = class plugman extends EventEmitter {
    logger
    constructor(serverlist,logger) {
        super();
        logger.log("Importing plugins...",stdio)
        try{
            manifest = require("./plugins/manifest.json")
        }catch(err){
            this.emit("error",err)
        }
        this.logger=logger
        this.initPlugins();
        

    }
    initPlugins(){
        this.logger.log("got here")
        plugins=[];
        this.logger.log(manifest[0])
        manifest.forEach(element => {
            plugins.push(element.file);
        });
        this.logger.log(plugins)
    }
}