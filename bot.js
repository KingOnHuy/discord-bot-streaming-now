require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
// Requiring discord-buttons and binding it to the initialised client.
const disbut = require('discord-buttons')(client);
const { MessageButton } = require("discord-buttons")

console.log("Load .env");
// Load .env
let userList = process.env.USER_WISHLIST.split(',');
if (!Array.isArray(userList)) {
  console.error("Please set USER_WISHLIST")
  return
}
console.log(userList);

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

client.on('message', async msg => {
  if (msg.content.startsWith('k!reset')) {
    // msg.reply('pong');
    const isInVoice = msg.member?.voice.channel?.name;

    if (isInVoice) {
      const isChannelChangedName = isInVoice.match(/(\[On Air 🔴\] - )/gu)
      if (!isChannelChangedName) {
        msg.reply('ไม่ต้องรีเซ็ต');
        return
      }
      msg.react('⌛')
      if (!isCanChangeName) {
        console.error('Can not Change Name, Maybe rate limit.');
        msg.reply('Can not Change Name, Maybe rate limit. รอก่อนนะ');
        msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        return
      }
      await changeNameChannel(msg, msg.member?.voice.channel?.name.replace(/(\[On Air 🔴\] - )/gu, ''))
      msg.reply('Name has been reset.')
      isCanChangeName = true
    } else {
      msg.reply('เข้าห้องก่อนดิ')
    }
    msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
  } else if (msg.content.startsWith('k!button')) {
    let button = new MessageButton()
      .setLabel('ปุ่มโว้ยยยยย')
      .setStyle('blurple')
      .setID('button')
    await msg.channel.send(`Ayo`, button);
  }
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
  // if (!oldState || !newState) return;

  const isOnline = newState.member?.presence.status === 'online';
  const isInVoice = newState.member?.voice.channel?.name;
  // const isStremingOldState = oldState.member?.presence.activities.find(e => e.type === 'STREAMING');
  const isStremingNewState = newState.member?.presence.activities.find(e => e.type === 'STREAMING') !== undefined;
  // console.log(isOnline);
  // console.log(isInVoice);

  // console.log('--------------isStremingOldState----------------')
  // console.log(isStremingOldState);
  // console.log('--------------isStremingNewState----------------')
  // console.log(isStremingNewState);

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
