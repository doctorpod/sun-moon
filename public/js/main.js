var sunMoon = function() {
  function start(bgId, wId) {
    sunMoon.background.start(bgId, wId);
    setTimeout(sunMoon.background.stop, 15000);
  }

  return {
    start: start
  }
}();
