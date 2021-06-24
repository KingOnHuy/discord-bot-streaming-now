require('dotenv').config();
const fs = require('fs');

const Discord = require('discord.js');
const client = new Discord.Client();
client.commands = new Discord.Collection();

const config = require("./config.json");

// Requiring discord-buttons and binding it to the initialised client.
const disbut = require('discord-buttons')(client);
// const { MessageButton } = require("discord-buttons")

console.log("Load .env");
// Load .env
let userList = process.env.USER_WISHLIST.split(',');
if (!Array.isArray(userList)) {
  console.error("Please set USER_WISHLIST")
  return
}
console.log(userList);

console.log("Load commands");
fs.readdir("./commands/", (err, files) => {
  if (err) console.log(err);

  let jsfile = files.filter(f => f.split(".").pop() === "js")
  if (jsfile.length <= 0) {
    console.log("Couldn't find commands.");
    return;
  }

  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded!`);
    client.commands.set(props.help.name, props);
  });

});

// Glo
var isCanChangeName = true
var cacheChannelsList = {}
// var testChannel = null

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    activity: {
      type: "PLAYING",
      name: "k!reset",
    },
    status: 'online',
  }).catch(console.error);
  // testChannel = client.channels.cache.get('856929341329113121')
});

//Command Manager
client.on("message", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;

  let prefix = config.prefix;
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

  //Check for prefix
  if (!cmd.startsWith(config.prefix)) return;

  let commandFile = client.commands.get(cmd.slice(prefix.length));
  console.log(commandFile);
  if (commandFile) commandFile.run(client, message, args);
});

client.on('clickButton', async (button) => {
  console.log('------------------------------ปุ่มมา------------------------------')
  console.log(`button.id ${button.id}`);
  if (button.id === 'button') {
    button.reply.send(`${button.clicker.member} จะกดทำไมวะฮะ`)
  }
});

client.on('presenceUpdate', async (oldState, newState) => {
  // Check User are in wishlist
  // TODO save to DB
  if (!userList.includes(newState.userID)) return;

  console.log('------------------------------ presenceUpdate --------------------');
  console.log(newState.user.username);
  if (!oldState || !newState) return;

  const isOnline = newState.member?.presence.status === 'online';
  const isInVoice = newState.member?.voice.channel?.name;
  // const isStremingOldState = oldState.member?.presence.activities.find(e => e.type === 'STREAMING');
  const isStremingNewState = newState.member?.presence.activities.find(e => e.type === 'STREAMING') !== undefined;

  if (isOnline && isInVoice) {
    // Check channel name is now "on air"
    isStremingOldStateTemp = cacheChannelsList[newState.userID]?.stream
    const isChannelChangedName = isInVoice.match(/(\[On Air 🔴\] - )/gu)

    if (!isStremingOldStateTemp && isStremingNewState) {
      if (isChannelChangedName) return;
      console.log(`[On Air 🔴] in ${isInVoice}`);

      if (!isCanChangeName) {
        console.error("Can not Change Name, Maybe rate limit.");
        return
      }
      await changeNameChannel(newState, `[On Air 🔴] - ${isInVoice}`)
      isCanChangeName = true
    } else if (isStremingOldStateTemp && !isStremingNewState) {
      console.log(`[Not stream now] in ${isInVoice}`);

      if (!isCanChangeName) {
        console.error("Can not Change Name, Maybe rate limit.");
        return
      }
      await changeNameChannel(newState, isInVoice.replace(/(\[On Air 🔴\] - )/gu, ''))
      isCanChangeName = true
    }

    //  else if (!isChannelChangedName && isStremingNewState) {
    //   console.log(`[On Air 🔴] - When channel name not change - in ${isInVoice}`);
    //   await changeNameChannel(newState, `[On Air 🔴] - ${isInVoice}`)
    // }

    cacheChannelsList[newState.userID] = {
      stream: isStremingNewState,
    }

    console.log('--------------cacheChannelsList----------------')
    console.log(cacheChannelsList);
  }
})

async function changeNameChannel(state, name) {
  isCanChangeName = false
  console.log('changeNameChannel');
  // testChannel.send(name)
  return await state.member.voice.channel.setName(name).then(newChannel => {
    console.log(`Channel's new name is ${newChannel.name}`);
    return newChannel
  }).catch(error => {
    console.log(error);
    return error
  })
}

// client.on('error', error => {
//   console.error(error);
// })

client.on('rateLimit', rateLimit => {
  console.log('--------------rateLimit--------------');
  console.log(rateLimit);
})

client.on('disconnect', () => {
  console.log("Disconnected !!!");
})

client.login(process.env.TOKEN);
