module.exports = (b) => {

  let mic = require("mic");
  // "plughw:1, 0"
  let micInstance = mic({
    rate: "44100",
    channels: "2",
    device: "hw:0,0"
  });

  // let micInputStream = micInstance.getAudioStream();
  // b.guilds.get("518287632988635136").channels.get("518347922258001930").join().then((c) => {
  //   c.play(micInputStream);
  //   b.guilds.get("467813883617345536").channels.get("467813883617345540").join().then((c) => {
  //     c.play(micInputStream);
  //     micInstance.start();
  
  //   });
  // });



  return
  b.guilds.get("467813883617345536").channels.get("467833971808665610").join().then((c) => {
      c.play("https://www.myinstants.com/media/sounds/you.mp3");
      c.stopPlaying();
  
      let pcm = require('pcm-util')

      let r = c.receive("pcm");

      const s = require("stream").Transform();
      s.transform = function (d) {
        this.buffer = this.buffer ? Buffer.concat([
          this.buffer,
          d.slice(0, 32768 - this.buffer.length)
        ]) : Buffer.from(d);

        if (this.buffer.length === 32768) {
          console.log(this.buffer)
          this.push(this.buffer);
          this.buffer = null;
        }
      };

      // let length = pcm.toAudioBuffer(d, {
      //   sampleRate: c.samplingRate
      // }).duration;
      // let buffer = new AudioBuffer(null, {
      //   length,
      //   sampleRate: c.samplingRate
      // });

      r.on("data", (d) => {
        audioCtx.decodeAudioData(d, function(buffer) {
          console.log(buffer)
        },
  
        function(e){ console.log("Error with decoding audio data" + e.err); });
  
    });
      c.play(s);
  });
};

// 32768