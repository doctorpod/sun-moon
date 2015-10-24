var background = function() {
  var animation;

  function start(bgId, wId) {
    var canvas = document.getElementById(bgId),
        ctx = canvas.getContext("2d");

    console.log("Starting background: " + bgId + ", " + wId);
    getData(ctx, wId);
  }

  function getData(ctx, wId) {
    var data = {
      wind: 5.19,
      rain: 0.05,
      snow: 0.05,
      cloud: 0.75
    };

    // fetch from server
    // then
    draw(ctx);
    weather.stop();
    weather.start(wId, data, 150, 200, 200, 75);

    background.animation = setTimeout(function() {
      getData(ctx, wId);
    }, 1000);
  }

  function draw(ctx) {
    console.log("Drawing background...");
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  }

  function stop() {
    console.log("Stopping background");
    weather.stop();
    clearTimeout(background.animation);
  }

  return {
    start: start,
    stop: stop
  }
}();
