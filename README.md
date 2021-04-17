# CamelBot
A bot that proxies your Java server and manages your Discord.
To set this up, download the index.json and create your own configs like the ones here.
For each server you must download CamelWrapper to connect to CamelBot and install CamelMod in the mod folder of your fabric (only fabric for now) mod folder. 

This is under development
# TODO
- [ ] Implement transferring between servers using commands
- [ ] Implement running commands from the game
- [ ] Implement AIML to make CamelBot more lifelike and get rid of commands (maybe)
- [x] Regulate content in Discord channels
- [ ] Configure all CamelBot features from a configuration file
- [ ] Update specific servers from a command using wget
- [ ] Reimpliment logging after 1.9 update
- [ ] Get chat channel from config
- [ ] Impliment baked in Camel whitelist for role joining
- [ ] Impliment CamelVelocity features
- [ ] Impliment CamelCamera features

# socket.io Protocol

## CamelBot to Minecraft

#### ```("chat", (chat))```
A message to be displayed on the screen of players. 
Does not include the author because it can be anything.
#### ```("command", (command))```
A command to be run. To get output, scan stdout.
#### ```("players", ())```
###### ```return(array<string>)```
Requests list of players online, and returns an array of strings with their usernames.
#### ```("whitelist-add", (username)```
This command whitelists a player, but it does more than just runs the command. When a Geyser member joins the server, the mod will need to cache the username and the UUID because a Geyser username won't automatically work.
#### ```("whitelist-remove", (username)```
Remove username from the whitelist
#### ```("whitelist-list",())```
###### ```return(array<string>)```
Returns a list of whitelisted players, listed by username


## Minecraft to CamelBot

#### ```("key", (key))```
###### ```return(bool)``` 
On a connection, Minecraft sends predetermined a key to CamelBot. If they key is invalid or already in use, CamelBot will return false. Otherwise true.
#### ```("chat", (chat,author))```
When a chat message is sent, CamelBot will calculate what to do with it. The built in chat protocol is canceled.
#### ```("stdout", (log))```
All messages from the console will be spit out here.



