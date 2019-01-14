const https = require("https");

module.exports = (bot) => {
  let getLastFMTrack = function (username) {
    return new Promise((resolve, reject) => {
      https.get("https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=" + username + "&api_key=" + bot.secret.lastfmkey + "&limit=1&format=json", (res) => {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (d) => {
            rawData += d;
        });
        res.on("end", () => {
            try {
              const data = JSON.parse(rawData);
              if (data.message) {
                reject(data.message);
              }
              let lastfmtrack = data.recenttracks.track[0];
              if (lastfmtrack) {
                resolve(lastfmtrack);
              } else {
                reject();
              }
            } catch (e) {
              console.error(e.message);
            }
        });
      });
    });
  };

  let sendNP = function (msg, user, track) {
    let a = {
      thumbnail: {
        url: track.image[3]["#text"]
      },
      author: {
        name: `${user}'s LastFM`,
        url: "https://www.last.fm/user/" + user
      },
      title: track.name,
      url: track.url,
      description: `${track.artist["#text"]} - ${track.album["#text"]}`
    };

    if (msg.author.id === bot.user.id) {
      bot.edit(msg, "Now playing:", a);
    } else {
      bot.send(msg, "Now playing:", a);
    }
  };

  // fmset: user lastfm username config
  bot.registerCommandConfigStr({
    name: "fmset",
    verbose: "LastFM Username",
    setting: "lastfm",
    permission: "user",
    category: "LastFM"
  });

  // fm: bot lastfm song command
  bot.registerCommand({
    name: "fm",
    category: "LastFM",
    info: {
      args: "[lastfm username]",
      description: "shows the track you or someone else is playing"
    },
    generator: async (msg, args) => {
      let lastfmusername = args[0] || bot._.get(bot.usersettings, msg.author.id + ".lastfm");
      if (lastfmusername) {
        let nmsg = await bot.send(msg, "LastFM", "wait a sec");
        let lastfmtrack = await getLastFMTrack(lastfmusername).catch((e) => {
          bot.edit(nmsg, "LastFM", e || "nothing to show");
        });
        if (lastfmtrack) {
          sendNP(nmsg, lastfmusername, lastfmtrack);
        }
      } else {
        bot.send(msg, "LastFM", "gimme a username or set yours with the `fmset` command");
      }
    }
  });

  let currenttrack;
  let username = "kylr_1";

  // np: bot lastfm song command
  bot.registerCommand({
    name: "np",
    category: "LastFM",
    info: {
      args: "[anything]",
      description: "shows the track currently playing"
    },
    generator: (msg) => {
      if (!currenttrack) {
        bot.send(msg, "Nothing is playing");
        return;
      }

      sendNP(msg, username, currenttrack);
    }
  });

  // bot currently playing status
  setInterval(async () => {
    let lastfmtrack = await getLastFMTrack(username).catch(() => {
      console.log("lastfm playing status fuck up");
    });

    if (!currenttrack || currenttrack.url !== lastfmtrack.url) {
      currenttrack = lastfmtrack;
      let status = currenttrack.name + " by " + currenttrack.artist["#text"];
      bot.log.log("Setting to: " + status, "LastFM", "bgCyan", true);
      bot.editStatus(bot.defaultStatus, {name: status,
        type: 2});
    }
  }, 30000);
};