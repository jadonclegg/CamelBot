const path = require('path');
const { EventEmitter } = require('events');
const net = require('net');
const process = require('process');


module.exports = class droneship extends EventEmitter {
    #tcp_server;
    #droneshipPort;
    connected;
    server_name
    s_client
    logchat
    mainlog

    constructor(port,address,name,logchat,mainlog){
        super();
        this.server_name=name
        this.logchat=logchat
        this.mainlog=mainlog
        this.tcp_server=net.createServer();
        this.droneshipPort=this.tcp_server.listen(port,address,()=>{
            this.emit('console.log', "Opening docking for "+ name+ " on port "+address+":"+port)
        })
        this.droneshipPort.on("connection",(client)=>{
            this.emit('console.log',name+" connected")
            this.s_client=client
            this.connected=true
            client.on('data',(data)=>{
                var packet
                try {
                    packet =JSON.parse(data)
                } catch{
                    //Sometimes packets get mashed together
                    //this.emit('console.log',"Mashed potato")
                    //this.emit('console.log',data.toString().split('}')[1]+="}")
                    try{
                        
                        packet = JSON.parse(data.toString().split('}')[1]+="}")
                    }catch{
                        this.emit('console.log',"Catch: "+data)
                        //Garbage packet, discard it
                    }
                }
                try {
                    var temp = packet.packet
                }catch{
                    return;
                }
                if (packet.packet=="log"){
                    this.emit('log', packet.log,this.logchat)
                }
                if (packet.packet=="chat"){
                    this.emit('chat',packet.sender,packet.message,this.server_name)
                }
                if (packet.packet=="playerlist"){
                    this.emit('playerlist',packet.list)
                }
                if (packet.packet=="reqCoords"){
                    this.emit('console.log',"drone_coords")
                    this.emit('reqCoords',packet.list)
                }
            });
            client.on("close",()=>{
                this.emit('console.log',"Lost connection to "+name)
                this.connected=false
                client.removeAllListeners();
            });
            
        });
        
        


    }
    send(toSend){
        if (this.connected){
            this.s_client.write(toSend)
            
        }
    }
    restart(){
        if (this.connected){
            var toSend={
                "packet":"restart"
            }
            thils.s_client.write(JSON.stringify(toSend));
        }
    }

    

    
    



}