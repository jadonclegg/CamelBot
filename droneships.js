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

    constructor(port,address,name){
        super();
        this.server_name=name
        this.tcp_server=net.createServer();
        this.droneshipPort=this.tcp_server.listen(port,address,()=>{
            console.log("Opening docking for "+ name+ " on port "+address+":"+port)
        })
        this.droneshipPort.on("connection",(client)=>{
            console.log(name+" connected")
            this.s_client=client
            this.connected=true
            client.on('data',(data)=>{
                var packet
                try {
                    packet =JSON.parse(data)
                } catch{
                    //Sometimes packets get mashed together
                    console.log("Mashed potato")
                    console.log(data.toString().split('}')[1]+="}")
                    try{
                        
                        packet = JSON.parse(data.toString().split('}')[1]+="}")
                    }catch{
                        console.log("Catch: "+data)
                        //Garbage packet, discard it
                    }
                }
                if (packet.packet=="log"){
                    this.emit('log', packet.log)
                }
                if (packet.packet=="chat"){
                    this.emit('chat',packet.sender,packet.message,this.server_name)
                }
                if (packet.packet=="playerlist"){
                    this.emit('playerlist',packet.list)
                }
                if (packet.packet=="reqCoords"){
                    console.log("drone_coords")
                    this.emit('reqCoords',packet.list)
                }
            });
            client.on("close",()=>{
                console.log("Lost connection to "+name)
                this.connected=false
                client.removeAllListeners();
            })
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