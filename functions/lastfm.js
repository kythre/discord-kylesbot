const https = require("https");

module.exports = (bot) => {
  let currenttrack;

  bot.registerCommand({
    name: "np",
    category: "fuck idk",
    info: {
      args: "[anything]",
      description: "shows the track currently playing"
    },
    generator: (msg) => {
      if (!currenttrack) {
        bot.send(msg, "Nothing is playing");
        return;
      }

      bot.send(msg, "Now playing:", {
        thumbnail: {
          url: currenttrack.image[3]["#text"]
      },
     author: {
         name: "Now Playing",
         url: "https://www.last.fm/user/kylr_1"
     },
      title: currenttrack.name,
      url: currenttrack.url,
      description: currenttrack.artist["#text"]
      });
    }
  });

  setInterval(() => {
    https.get("https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=kylr_1&api_key=" + bot.secret.lastfmkey + "&limit=1&format=json", (res) => {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (d) => {
            rawData += d;
        });

        res.on("end", () => {
            try {
              const data = JSON.parse(rawData);
              if (!currenttrack || currenttrack.url !== data.recenttracks.track[0].url) {
                currenttrack = data.recenttracks.track[0];
                let status = currenttrack.name + " by " + currenttrack.artist["#text"];
                bot.log.log("Setting to: " + status, "LastFM", "bgCyan", true);
                bot.editStatus(bot.defaultStatus, {name: status,
                  type: 2});
              }
            } catch (e) {
              console.error(e.message);
          }
      });
    });
  }, 30000);
};