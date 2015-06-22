var current_watch;
if(Pebble.getActiveWatchInfo) {
  try {
    current_watch = Pebble.getActiveWatchInfo();
  } catch(err) {
    current_watch = {
      platform: "basalt",
    };
  }
} else {
  current_watch = {
    platform: "aplite",
  };
}
console.log(JSON.stringify(current_watch));

module.exports = current_watch;