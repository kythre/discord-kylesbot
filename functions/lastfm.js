const https = require("https");

module.exports = (bot) => {
  setInterval(() => {
    https.get("https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=kylr_1&api_key=" + bot.secret.lastfmkey + "&limit=1&format=json", (res) => {
        res.setEncoding("utf8");
        let rawData = "";
        let c;
        res.on("data", (d) => {
            rawData += d;
        });

        res.on("end", () => {
            try {
              const data = JSON.parse(rawData);
              let currenttrack = data.recenttracks.track[0];
              let artist = currenttrack.artist["#text"];
              let trackname = currenttrack.name;
              let a = trackname + " by " + artist;
              bot.log.log("Song: " + a, "LastFM", "bgCyan", true);

              if (c !== a) {
                bot.log.log("Setting to: " + a, "LastFM", "bgCyan", true);
                bot.editStatus("online", {name: a,
                  type: 2});
                c = a;
              }

              bot.editAFK(bot.afk);
            } catch (e) {
              console.error(e.message);
          }
      });
    });
  }, 30000);
};