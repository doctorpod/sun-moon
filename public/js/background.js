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
    var url = "/data" + window.location.search,
        request = new XMLHttpRequest();
    var period = 15000;

    request.open("GET", url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        console.log("Request returned success");
        data.set(JSON.parse(request.responseText));
        draw(ctx);
        sunMoon.weather.stop();
        sunMoon.weather.start(wId, data.weather(), 150, 175, 200, 75);

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
    var sunTrackPos = 0.0,
        moonTrackPos = 1.0;

    ctx.fillStyle = "rgb(200,0,0)";
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    stars.draw(ctx);
    drawHorizon(ctx);
    track.init(ctx);
    track.draw(ctx);
    drawGuage(ctx, 15.6);
    sun.draw(ctx, track.position(sunTrackPos));
    moon.draw(ctx, track.position(moonTrackPos), 0.5);
  }

  function draw(ctx) {
    var sunTrackPos = data.trackPos("sun"),
        sunPos;

    console.log("Drawing background...");
    track.init(ctx);
    sunPos = track.position(sunTrackPos);
    paintSky(ctx, sunTrackPos, sunPos);

    stars.draw(ctx);
    drawHorizon(ctx);
    track.draw(ctx);
    drawGuage(ctx, data.weather().temp);
    sun.draw(ctx, sunPos);
    moon.draw(ctx, track.position(data.trackPos("moon")));
  }

  function shiftPalet(from, to, factor) {
    var newPalet = [ [], [], [] ],
        shiftedVal;

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        shiftedVal = Math.round(from[i][j] - (factor * (from[i][j] - to[i][j])));
        newPalet[i].push(shiftedVal);
      }
    }

    return newPalet;
  }

  function applyStops(grd, palet) {
    var colours = palet.map(function(colour) {
      return "rgb("+colour[0]+","+colour[1]+","+colour[2]+")";
    });

    grd.addColorStop(0, colours[0]);
    grd.addColorStop(0.06, colours[1]);
    grd.addColorStop(1, colours[2]);
  }

  function paintSky(ctx, sunTrackPos, sunPos) {
    var horizonProximity = 0.5 - Math.abs((sunTrackPos % 1) - 0.5),
        dayPalet = [ [255,255,255], [60,130,255], [0,0,255] ],
        horizonPalet = [ [255,0,0], [180,40,140], [0,0,230] ],
        nightPalet = [ [0,0,0], [0,0,0], [0,0,0] ];

    var grd = ctx.createRadialGradient(
      sunPos.x,
      sunPos.y,
      23,
      sunPos.x,
      sunPos.y,
      300
    );

    if (sunTrackPos < 1) {
      // Above horizon
      if (horizonProximity < 0.05) {
        applyStops(
          grd,
          shiftPalet(horizonPalet, dayPalet, horizonProximity/0.05)
        );
      }
      else {
        applyStops(grd, dayPalet);
      }
    }
    else {
      // Below horizon
      if (horizonProximity < 0.05) {
        applyStops(
          grd,
          shiftPalet(horizonPalet, nightPalet, horizonProximity/0.05)
        );
      }
      else {
        applyStops(grd, nightPalet);
      }
    }

    console.log("horizonProximity: " + horizonProximity);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  }

  var data = function() {
    var raw;

    function getRaw() {
      return raw;
    }

    function set(data) {
      raw = data;
    }

    function trackPos(body) {
      var d = new Date(),
          now = d.getTime() / 1000,
          lowerBound,
          events = raw.sunmoon[body];

      for (i = 0; events[i].unix_t < now; i++) {
        lowerBound = i;
      }

      if (events[lowerBound].type == "rise") {
        r = events[lowerBound].unix_t;
        s = events[lowerBound+1].unix_t;
        return (now - r) / (s - r);
      }
      else {
        s = events[lowerBound].unix_t;
        r = events[lowerBound+1].unix_t;
        return ((now - s) / (r - s)) + 1.0;
      }
    }

    function rain() {
      if (raw.hasOwnProperty("rain")) {
        if (raw.rain.hasOwnProperty("1h")) {
          return raw.rain["1h"];
        }
        else {
          return raw.rain["3h"] / 3.0;
        }
      }
      else {
        return 0.0;
      }
    }

    function snow() {
      if (raw.hasOwnProperty("snow")) {
        if (raw.snow.hasOwnProperty("1h")) {
          return raw.snow["1h"];
        }
        else {
          return raw.snow["3h"] / 3.0;
        }
      }
      else {
        return 0.0;
      }
    }

    function weather() {
      return {
        cloud: raw.weather.clouds.all / 100,
        temp:  raw.weather.main.temp,
        wind:  raw.weather.wind.speed,
        rain: rain(),
        snow: snow()
      };
    }

    return {
      getRaw: getRaw,
      set: set,
      trackPos: trackPos,
      weather: weather
    }
  }();

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

  var track = function() {
    var radius, x, y;

    function init(ctx) {
      radius = goldenReduce(ctx.canvas.clientHeight, 1) * 0.5;
      x = ctx.canvas.clientWidth / 2;
      y = ctx.canvas.clientHeight * 0.5;
    }

    function draw(ctx) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI*2.0);
      ctx.stroke();
    }

    function position(trackPos) {
      var angle = Math.PI * (0.5 - trackPos),
          xo = Math.sin(angle) * radius,
          yo = Math.cos(angle) * radius;

      return {
        x: x - xo,
        y: y - yo
      }
    }

    return {
      init: init,
      draw: draw,
      position: position
    }
  }();

  function drawGuage(ctx, temp) {
    var width = 5,
        secHeight = 12,
        needleOverhang = 10,
        brightness = 180,
        needleY,
        x = 170,
        y = 270,
        MIN_IDEAL_TEMP = 15.0,
        MAX_IDEAL_TEMP = 25.0;

    console.log("Drawing thermometer: " + temp);

    // Thermometer body
    ctx.beginPath();
    ctx.fillStyle = "rgb("+brightness+",0,0)";
    ctx.fillRect(x, y, width, secHeight);
    ctx.arc(x+(width/2), y, width/2, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "rgb(0,"+brightness+",0)";
    ctx.fillRect(x, y+secHeight, width, secHeight);
    ctx.fillStyle = "rgb(0,0,"+brightness+")";
    ctx.fillRect(x, y+(2*secHeight), width, secHeight);
    ctx.fillStyle = "rgb("+brightness+","+brightness+","+brightness+")";
    ctx.fillRect(x, y+(3*secHeight), width, secHeight);
    ctx.arc(x+(width/2), y+(4*secHeight), width, 0, 2 * Math.PI, false);
    ctx.fill();

    // Needle
    if (temp <= 0) {
      needleY = y + (3 * secHeight) - ((temp/30) * secHeight);
    }
    else if (temp <= MIN_IDEAL_TEMP) {
      needleY = y + (3 * secHeight) - ((temp/MIN_IDEAL_TEMP) * secHeight);
    }
    else if (temp <= MAX_IDEAL_TEMP) {
      needleY = y + (3 * secHeight) - ((temp/MAX_IDEAL_TEMP) * (2 * secHeight));
    }
    else {
      needleY = y + (3 * secHeight) - ((temp/30) * (3 * secHeight));
    }

    ctx.strokeStyle = "#aaa";
    ctx.moveTo(x - needleOverhang, needleY);
    ctx.lineTo(x + width + needleOverhang, needleY);
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
    data: data,
    start: start,
    stop: stop
  }
}();
