var sunMoon = function() {
  function start(bgId, wId) {
    background.start(bgId, wId);
    setTimeout(background.stop, 15000);
  }

  return {
    start: start
  }
}();
