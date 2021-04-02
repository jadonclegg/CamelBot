// Basement module built for CamelBot
// Authored by jkcoxson
// Long live camels

const { EventEmitter } = require('events');
let logger;
const minecraft = "minecraft";
const stdio = "console";
const discord = "discord";
const all = "all"

module.exports = class basement extends EventEmitter {
    constructor(client,guild,logger) {
        super();
        logger.log("Initialized a Discord server named "+guild.name,stdio)

    }
}