// Weather
sunMoon.weather = function() {
  var animation; // Keep a ref to it so we can stop it

  function start(canvasId, data, x, y, width, height) {
    var canvas = document.getElementById(canvasId),
        ctx = canvas.getContext("2d");

    console.log("Starting weather: " + canvasId);
    draw(ctx, data, x, y, width, height);
  }

  function draw(ctx, data, x, y, width, height) {
    var rainH = Math.round(height/2),
        cloudH = Math.round(height/2);

    ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    clouds.draw(ctx, data.cloud, data.wind, x, y, width, cloudH);
    rain.draw(ctx, data.rain, data.wind, x, y+rainH, width, rainH);
    snow.draw(ctx, data.snow, data.wind, x, y+rainH, width, rainH);

    weather.animation = requestAnimationFrame(function() {
      draw(ctx, data, x, y, width, height);
    });
  }

  function stop() {
    console.log("Stopping weather");
    cancelAnimationFrame(weather.animation);
  }

  var clouds = function() {
    var trailingEdge = 250, // TODO derived from what?
        data = [];

    function draw(ctx, cover, windSpeed, x, y, width, height) {
      var displacement = windSpeed/100,
          spawnWidth = width * 0.2,
          tEdge = trailingEdge + displacement,
          newClouds = [],
          spanwArea = spawnWidth * height,
          cloudR, cloudX, cloudY,
          maxR = height * 0.3,
          minR = height * 0.1,
          grd = ctx.createRadialGradient(
              x + Math.round(width/2),
              y + height,
              0,
              x + Math.round(width/2),
              y + height,
              width
          );

      // TODO remove
      // ctx.rect(x, y, width, height);
      // ctx.stroke();
      ctx.beginPath();

      grd.addColorStop(0.4, 'rgba(255,255,255,1)');
      grd.addColorStop(0.5, 'rgba(255,255,255,0)');

      // Spawn new clouds
      if (tEdge > (x + spawnWidth)) {
        tEdge -= spawnWidth;

        for(var area = 0; area < (spanwArea * cover); ) {
          cloudR = (Math.random() * (maxR - minR)) + minR;
          cloudX = (Math.random() * spawnWidth) + tEdge;
          cloudY = (Math.random() * (height-(2*cloudR)) + y + cloudR);

          newClouds.push({ x: cloudX, y: cloudY, r: cloudR });
          area = area + ((2 * cloudR) * (2 * cloudR));
        }
      }

      // Transform existing clouds
      data.forEach(function(cloud) {
        cloudX = cloud.x + displacement;
        cloudY = cloud.y;
        cloudR = cloud.r;

        if (cloudX < (x + width)) {
          newClouds.push({ x: cloudX, y: cloudY, r: cloudR });
        }
      });

      // Draw clouds
      ctx.clearRect(x, y, width, height);
      newClouds.forEach(function(cloud) {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.r, 0, 2 * Math.PI, false);
        ctx.fillStyle = grd;
        ctx.fill();

        drawCloudTail(ctx, -1, cloud.x, cloud.y, cloud.r, 0.6);
        drawCloudTail(ctx, 1, cloud.x, cloud.y, cloud.r, 0.4);
      });

      // Reset data
      trailingEdge = tEdge;
      data = newClouds;
    }

    function drawCloudTail(ctx, dir, parentX, parentY, parentRadius, reduction) {
      var newRadius = parentRadius * reduction,
          newX = parentX + (dir * parentRadius),
          newY = parentY + (parentRadius * (1.0 - reduction));

      if(parentRadius > 1) {
        ctx.beginPath();
        ctx.arc(newX, newY, newRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        drawCloudTail(ctx, dir, newX, newY, newRadius, reduction);
      }
    }

    return {
      draw: draw
    }
  }();

  var rain = function() {
    var drops = [];

    function draw(ctx, lastHr, windSpeed, x, y, width, height) {
      var newX, newY,
          travel = windSpeed/10,
          dropsPerFrame = lastHr * 0.000001,
          newDrops = [];

      if (lastHr == 0) {
        return;
      }

      // ctx.rect(x, y, width, height);
      // ctx.stroke();
      ctx.beginPath();

      // Draw existing drops
      drops.forEach(function(drop) {
        newA = drop.a - 0.005;
        newX = drop.x + travel;

        if (newA > 0 && newX < (x + width)) {
          ctx.strokeStyle = "rgba(200,200,200," + newA + ")";
          ctx.moveTo(newX, y);
          ctx.lineTo(newX + travel, y + drop.l);
          ctx.stroke();
          newDrops.push({
            x: newX,
            l: drop.l,
            a: newA
          });
        }
      });

      // Spawn a new drop
      newDrops.push({
        x: x + (Math.random() * width),
        l: Math.random() * height,
        a: lastHr * 2  // The more rain the darker it starts and longer it lasts
      });

      drops = newDrops;
    }

    return {
      draw: draw
    }
  }();

  var snow = function() {
    var flakes = [];

    function draw(ctx, lastHr, windSpeed, x, y, width, height) {
      var newX, newY,
          travel = windSpeed/20,
          dropRate = 0.25,
          newFlakes = [];

      if (lastHr == 0) {
        return;
      }

      // ctx.rect(x, y, width, height);
      // ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = "white";

      // Draw existing flakes
      flakes.forEach(function(flake) {
        newX = flake.x + travel + ((Math.random() - 0.5) * 2); // Wobble
        newY = flake.y + dropRate;

        if (newX < (x + width) && newY < (y + height)) {
          ctx.moveTo(newX, newY);
          ctx.arc(newX, newY, 1, 0, Math.PI*2);
          ctx.stroke();

          newFlakes.push({
            x: newX,
            y: newY
          });
        }
      });

      // Spawn a new batch of flakes every 10th frame
      if (Math.random() > 0.9) {
        for (var i = 0; i < (20*lastHr); i++) {
          newFlakes.push({
            x: x + (Math.random() * width),
            y: y
          });
        }
      }

      flakes = newFlakes;
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
