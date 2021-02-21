const path = require('path');
const { EventEmitter } = require('events');
const net = require('net');
const process = require('process');
const mineflayer = require('mineflayer')


module.exports = class bot extends EventEmitter {
    bot


    constructor(IP,port,name,position,lookat,action){
        this.bot = mineflayer.createBot({ host: IP, port: port,username:name })
        
        
    }
    

}