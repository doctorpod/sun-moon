sunMoon.background = function() {
  var animation;

  function start(bgId, wId) {
    var canvas = document.getElementById(bgId),
        ctx = canvas.getContext("2d");

    console.log("Starting background: " + bgId + ", " + wId);
    stars.randomise(ctx);
    getData(ctx, wId);
  }

  function getData(ctx, wId) {
    var data = {
      wind: 5.19,
      rain: 0.05,
      snow: 0.05,
      cloud: 0.25,
      sun: {
        prevType: "rise",
        prev: 1445694214,
        next: 1445780244
      },
      moon: {
        prevType: "set",
        prev: 1445694214,
        next: 1445780244,
        phase: 0.5
      }
    };

    var url = "/data" + window.location.search,
        request = new XMLHttpRequest();
    var period = 1000;

    request.open("GET", url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        console.log("Request returned success");
        sunMoon.data = JSON.parse(request.responseText); // TODO use local var
        draw(ctx, sunMoon.data); // TODO
        sunMoon.weather.stop();
        sunMoon.weather.start(wId, data, 150, 175, 200, 75);

      } else {
        // We reached our target server, but it returned an error
        console.log("Request returned error - skipping drawing.");
        drawError(ctx);
      }

      background.animation = setTimeout(function() {
        getData(ctx, wId);
      }, period);
    };

    request.onerror = function() {
      // There was a connection error of some sort
      console.log("Connection error");
      drawError(ctx);

      background.animation = setTimeout(function() {
        getData(ctx, wId);
      }, period);
    };

    request.send();
  }

  function drawError(ctx) {
    ctx.fillStyle = "rgb(200,0,0)";
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    stars.draw(ctx);
    drawHorizon(ctx);
    drawTrack(ctx);
    drawGuage(ctx);
    sun.draw(ctx, {x:100, y:50});
    moon.draw(ctx, {x:50, y:50}, 0.5);
  }

  function draw(ctx, data) {
    console.log("Drawing background...");
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

    stars.draw(ctx);
    drawHorizon(ctx);
    drawTrack(ctx);
    drawGuage(ctx);
    // sun.draw(ctx, sunData);
    moon.draw(ctx, data);
  }

  function drawHorizon(ctx) {
    var lineStart = ctx.canvas.clientWidth * 0.1,
        lineEnd = ctx.canvas.clientWidth * 0.9,
        lineX = ctx.canvas.clientHeight * 0.5

    ctx.strokeStyle = "#aaa";
    ctx.beginPath();
    ctx.moveTo(lineStart, lineX);
    ctx.lineTo(lineEnd, lineX);
    ctx.stroke();
  }

  function drawTrack(ctx) {
    var arcRadius = goldenReduce(ctx.canvas.clientHeight, 1) * 0.5,
        arcX = ctx.canvas.clientWidth / 2,
        arcY = ctx.canvas.clientHeight * 0.5;

    ctx.beginPath();
    ctx.arc(arcX, arcY, arcRadius, 0, Math.PI*2.0);
    ctx.stroke();
  }

  function drawGuage(ctx) {
    var x = ctx.canvas.clientWidth / 2,
        y = 330,
        radius = 0.5 * goldenReduce(ctx.canvas.clientHeight, 3);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2.0);
    ctx.stroke();
  }

  function stop() {
    console.log("Stopping background");
    sunMoon.weather.stop();
    clearTimeout(background.animation);
  }

  var stars = function() {
    var data = [];

    function randomise(ctx) {
      for(var i = 0; i < 300; i++) {
        data.push({
          x: Math.random() * ctx.canvas.clientWidth,
          y: Math.random() * ctx.canvas.clientHeight,
          s: Math.random() * 2
        });
      }
    }

    function draw(ctx) {
      console.log("Drawing stars: " + data.length);
      ctx.fillStyle = "white";

      // Fixed artistic starry streaks - a poor man's milky way
      ctx.fillRect(120, 130, 1, 1);
      ctx.fillRect(130, 135, 1, 1);
      ctx.fillRect(160, 145, 1, 1);
      ctx.fillRect(260, 185, 1, 1);
      ctx.fillRect(265, 195, 2, 2);
      ctx.fillRect(288, 110, 1, 1);
      ctx.fillRect(355, 145, 1, 1);
      ctx.fillRect(367, 148, 1, 1);
      ctx.fillRect(389, 156, 2, 2);
      ctx.fillRect(398, 161, 1, 1);

      // Now the random background noise
      data.forEach(function(star) {
        ctx.fillRect(star.x, star.y, star.s, star.s);
      });
    }

    return {
      randomise: randomise,
      draw: draw
    }
  }();

  var sun = function() {
    function draw(ctx, pos) {
      var radius = 0.5 * goldenReduce(ctx.canvas.clientHeight, 5);

      console.log("Drawing sun");

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'yellow';
      ctx.fill();
    }

    return {
      draw: draw
    }
  }();

  function goldenReduce(val, factor) {
    for (var i = 0; i < factor; i++) {
      val = val * 0.618;
    }

    return val;
  }

  var moon = function() {
    function draw(ctx, pos, phase) {
      console.log("Drawing moon");
      var radius = 0.5 * goldenReduce(ctx.canvas.clientHeight, 5),
          x = pos.x, y = pos.y;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgb(214, 214, 214)';
      ctx.fill();

      // Markings
      var markings = [
        {x: x, y: y-(radius*0.6), r: radius*0.3},
        {x: x-(radius*0.5), y: y-(radius*0.5), r: radius*0.3},
        {x: x-(radius*0.4), y: y-(radius*0.2), r: radius*0.3},
        {x: x+(radius*0.5), y: y-(radius*0.5), r: radius*0.15},
        {x: x+(radius*0.6), y: y-(radius*0.2), r: radius*0.2},
        {x: x+(radius*0.8), y: y+(radius*0.1), r: radius*0.15},
        {x: x+(radius*0.5), y: y+(radius*0.1), r: radius*0.1},
        {x: x+(radius*0.5), y: y+(radius*0.2), r: radius*0.1},
        {x: x-(radius*0.4), y: y+(radius*0.5), r: 1}
      ];

      for(i = 0; i < markings.length; i++) {
        ctx.beginPath();
        ctx.arc(markings[i].x, markings[i].y, markings[i].r, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgb(115, 115, 115)';
        ctx.fill();
      }
    }

    return {
      draw: draw
    }
  }();

  return {
    start: start,
    stop: stop
  }
}();
