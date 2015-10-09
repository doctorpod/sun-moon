SunMoon = {};

// Radius of sun and moon
SunMoon.SUNMOON_RADIUS = 20;

// How far out the glare from the sun extends.
SunMoon.SUN_GLARE_RADIUS = 100;

// How close to the horizon the sun's glare starts to change colour.
// The smaller the number, the closer to the horizon, both when setting and
// rising.
SunMoon.SUN_GLARE_CHANGE_OFFSET = 0.05;

// Positions along circle
SunMoon.SUNRISE = 0.0;
SunMoon.SUNRISE_UPPER = SunMoon.SUNRISE + SunMoon.SUN_GLARE_CHANGE_OFFSET;
SunMoon.SUNRISE_LOWER = SunMoon.SUNRISE - SunMoon.SUN_GLARE_CHANGE_OFFSET;
SunMoon.SUNSET = 1.0;
SunMoon.SUNSET_UPPER = SunMoon.SUNSET - SunMoon.SUN_GLARE_CHANGE_OFFSET;
SunMoon.SUNSET_LOWER = SunMoon.SUNSET + SunMoon.SUN_GLARE_CHANGE_OFFSET;

SunMoon.clouds = {
  trailingEdge: 150,
  cover: 0,
  top: 0,
  bottom: 0,
  data: []
};

SunMoon.cloudsRunning = 0;

SunMoon.draw = function () {
  var ctx = this.mainCanvas.getContext("2d");
  var lineX = this.mainCanvas.height * 0.5;
  var lineStart = this.mainCanvas.width * 0.1;
  var lineEnd = this.mainCanvas.width * 0.9;
  var arcRadius = this.mainCanvas.height * 0.618 * 0.5;
  var arcX = this.mainCanvas.width / 2.0;
  var arcY = lineX;

  var sunAge = this.age(this.data["sunmoon"]["sun"]);
  var sunPos = this.arcPos(sunAge, arcX, arcY, arcRadius);
  var moonAge = this.age(this.data["sunmoon"]["moon"]);
  var moonPos = this.arcPos(moonAge, arcX, arcY, arcRadius);
  var moonPhase = this.phase(this.data["sunmoon"]["moon"]);

  console.log("sunAge: " + sunAge);
  console.log("moonAge: " + moonAge);
  console.log("moonPhase: " + moonPhase);
  console.log("clouds: " + this.data["weather"]["clouds"]["all"]);
  console.log("wind: " + this.data["weather"]["wind"]["speed"]);

  // Clear
  ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
  this.paintBackground(ctx, sunAge, sunPos, this.mainCanvas.width, this.mainCanvas.height);

  // Horizon
  ctx.strokeStyle = "#aaa";
  ctx.beginPath();
  ctx.moveTo(lineStart, lineX);
  ctx.lineTo(lineEnd, lineX);
  ctx.stroke();

  // Circle
  ctx.beginPath();
  ctx.arc(arcX, arcY, arcRadius, 0, Math.PI*2.0);
  ctx.stroke();

  this.drawSun(ctx, sunPos.x, sunPos.y);
  this.drawMoon(ctx, moonPos.x, moonPos.y);
  this.drawPhaseShadow(ctx, moonPos, this.SUNMOON_RADIUS, moonPhase);

  this.drawRain(
    ctx, 
    this.mainCanvas.width * 0.35, 
    this.mainCanvas.height * 0.42, 
    this.mainCanvas.width * 0.3, 
    this.mainCanvas.height * 0.05, 
    this.evaluateRain()
  );

  if (this.cloudsRunning === 0) {
    this.cloudsRunning = 1;
    requestAnimationFrame(this.newClouds.bind(SunMoon));
  }

  setTimeout(this.getData.bind(SunMoon), 15000);
}

SunMoon.evaluateRain = function() {
  if (this.data["weather"]["rain"] === undefined) {
    console.log("No rain data");
    return 0.0;
  }
  else {
    if (this.data["weather"]["rain"]["1h"] !== undefined) {
      console.log("rain.1h: " + this.data["weather"]["rain"]["1h"]);
      return this.data["weather"]["rain"]["1h"];
    }
    else if (this.data["weather"]["rain"]["3h"] !== undefined) {
      console.log("rain.3h: " + this.data["weather"]["rain"]["3h"]);
      return this.data["weather"]["rain"]["3h"] / 3.0;
    }
    else {
      console.log("Neither rain.1h nor rain.3h defined");
      return 0.0;
    }
  }
}

SunMoon.drawRain = function(ctx, x, y, width, height, volume) {
  ctx.strokeStyle = "#aaa";

  for(i = 0; i < 10; i++) {
    var dropX = (Math.random() * width) + x,
        dropY = (Math.random() * height) + y,
        dropXe = dropX + (5.0 * volume),
        dropYe = dropY + (30.0 * volume);

    ctx.beginPath();
    ctx.moveTo(dropX, dropY);
    ctx.lineTo(dropXe, dropYe);
    ctx.stroke();
  }
}

SunMoon.newClouds = function() {
  var ctx = this.cloudsCanvas.getContext("2d");
  var x = 10; 
  var y = 10; 
  var width = this.cloudsCanvas.width - 20;
  var height = this.cloudsCanvas.height - 20;
  var cover = this.data["weather"]["clouds"]["all"]/100.0;
  var displacement = this.data["weather"]["wind"]["speed"]/100;
  var spawnWidth = width * 0.2,
      trailingEdge = this.clouds.trailingEdge + displacement,
      newClouds = [],
      spanwArea = spawnWidth * height,
      cloudR, cloudX, cloudY,
      maxR = height * 0.3,
      minR = height * 0.1;
  var grd = ctx.createRadialGradient(this.cloudsCanvas.width/2, this.cloudsCanvas.height, 0, this.cloudsCanvas.width/2, this.cloudsCanvas.height, this.cloudsCanvas.width/2);

  grd.addColorStop(0.4, 'rgba(255,255,255,1)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0)');

  // Spawn new clouds
  if (trailingEdge > (x + spawnWidth)) {
    trailingEdge -= spawnWidth;

    for(var area = 0; area < (spanwArea * cover); ) {
      cloudR = (Math.random() * (maxR - minR)) + minR;
      cloudX = (Math.random() * spawnWidth) + trailingEdge;
      cloudY = (Math.random() * height) + y;

      newClouds.push({ x: cloudX, y: cloudY, r: cloudR });
      area = area + ((2 * cloudR) * (2 * cloudR));
    }
  }

  // Transform existing clouds
  this.clouds.data.forEach(function(cloud) {
    cloudX = cloud.x + displacement;
    cloudY = cloud.y;
    cloudR = cloud.r;

    if (cloudX < (x + width)) {
      newClouds.push({ x: cloudX, y: cloudY, r: cloudR });
    }
  });

  // Draw clouds
  ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  newClouds.forEach(function(cloud) {
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, 2 * Math.PI, false);
    ctx.fillStyle = grd;
    ctx.fill();

    SunMoon.drawCloudTail(ctx, -1, cloud.x, cloud.y, cloud.r, 0.6);
    SunMoon.drawCloudTail(ctx, 1, cloud.x, cloud.y, cloud.r, 0.4);
  });

  // Reset data
  this.clouds.trailingEdge = trailingEdge;
  this.clouds.data = newClouds;

  requestAnimationFrame(this.newClouds.bind(SunMoon));
}

SunMoon.drawClouds = function(ctx) {
  var cloudX, cloudY, cloudR;
  var grdLinear = ctx.createLinearGradient(0, this.clouds.top, 0, this.clouds.bottom);


  for(i = 0; i < this.clouds.data.length; i++) {
    cloudX = this.clouds.data[i].x;
    cloudY = this.clouds.data[i].y;
    cloudR = this.clouds.data[i].r;

    ctx.beginPath();
    ctx.arc(cloudX, cloudY, cloudR, 0, 2 * Math.PI, false);
    ctx.fillStyle = grdLinear;
    ctx.fill();

    this.drawCloudTail(ctx, -1, cloudX, cloudY, cloudR, 0.6);
    this.drawCloudTail(ctx, 1, cloudX, cloudY, cloudR, 0.4);
  }
}

SunMoon.drawCloudTail = function(ctx, dir, parentX, parentY, parentRadius, reduction) {
  var newRadius = parentRadius * reduction,
      newX = parentX + (dir * parentRadius),
      newY = parentY + (parentRadius * (1.0 - reduction));

  if(parentRadius > 1) {
    ctx.beginPath();
    ctx.arc(newX, newY, newRadius, 0, 2 * Math.PI, false);
    ctx.fill();
    this.drawCloudTail(ctx, dir, newX, newY, newRadius, reduction);
  }
}

SunMoon.phase = function(data) {
  var d = new Date();
  var now = d.getTime() / 1000;
  var lowerBound;

  for (i = 0; data[i]["unix_t"] < now; i++) {
    lowerBound = i;
  }

  return data[i]["phase"];
}

SunMoon.getData = function() {
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      SunMoon.data = JSON.parse(xhttp.responseText);
      SunMoon.draw();
    }
  }

  console.log("Fetching data");
  xhttp.open("GET", "/data", true);
  xhttp.send();
}

SunMoon.paintBackground = function(ctx, sunAge, sunPos, width, height) {
  var lowerSet = 1.0 + this.SUN_GLARE_CHANGE_OFFSET,
      lowerRise = 2.0 - this.SUN_GLARE_CHANGE_OFFSET;

  if (sunAge <= 1.0) {
    blue = 255;
  }
  else if (sunAge > lowerSet && sunAge < lowerRise) {
    blue = 0;
  }
  else {
    if (sunAge <= lowerSet) {
      blue = Math.round(((lowerSet - sunAge) / this.SUN_GLARE_CHANGE_OFFSET) * 255);
    }
    else {
      blue = Math.round(((sunAge - lowerRise) / this.SUN_GLARE_CHANGE_OFFSET) * 255);
    }
  }

  // Graduation around sun
  var grd = ctx.createRadialGradient(sunPos.x, sunPos.y, this.SUNMOON_RADIUS, sunPos.x, sunPos.y, this.SUN_GLARE_RADIUS);
  var glowColour = this.glowHue(sunAge);
  var skyColour = "rgb(0,0," + blue + ")";

  console.log("Sun glow colour: " + glowColour);
  console.log("Sky colour: " + skyColour);

  grd.addColorStop(0, glowColour);
  grd.addColorStop(1, skyColour);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, width, height);

  // Night sky with stars
  ctx.fillStyle = "white";
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

  for(i = 0; i < this.stars.length; i++) {
    ctx.fillRect(this.stars[i].x, this.stars[i].y, this.stars[i].s, this.stars[i].s);
  }
}

SunMoon.glowHue = function(sunAge) {
  var r, g, b;
  var upperRise = this.SUN_GLARE_CHANGE_OFFSET,
      upperSet = 1.0 - this.SUN_GLARE_CHANGE_OFFSET,
      lowerSet = 1.0 + this.SUN_GLARE_CHANGE_OFFSET,
      lowerRise = 2.0 - this.SUN_GLARE_CHANGE_OFFSET;

  if (sunAge > upperRise && sunAge < upperSet) {
    r = 255;
    g = 255;
    b = 255;
  }
  else if (sunAge > lowerSet && sunAge < lowerRise) {
    r = 0;
    g = 0;
    b = 0;
  }
  else if (sunAge <= upperRise) {
    r = 255;
    g = (sunAge/this.SUN_GLARE_CHANGE_OFFSET) * 255;
    b = (sunAge/this.SUN_GLARE_CHANGE_OFFSET) * 255;
  }
  else if (sunAge >= upperSet && sunAge <= 1.0) {
    r = 255;
    g = ((1.0-sunAge)/this.SUN_GLARE_CHANGE_OFFSET) * 255;
    b = ((1.0-sunAge)/this.SUN_GLARE_CHANGE_OFFSET) * 255;
  }
  else if (sunAge >= lowerRise) {
    r = ((sunAge-lowerRise)/this.SUN_GLARE_CHANGE_OFFSET) * 255;
    g = 0;
    b = 0;
  }
  else if (sunAge >= 1.0 && sunAge <= lowerSet) {
    r = ((lowerSet-sunAge)/this.SUN_GLARE_CHANGE_OFFSET) * 255;
    g = 0;
    b = 0;
  }
  else {
    console.log("ERROR: glowHue not deduced");
  }

  return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
}

SunMoon.randomiseStars = function() {
  this.stars = [];

  for(i = 0; i < 100; i++) {
    this.stars.push( {
      x: Math.random() * this.mainCanvas.width,
      y: Math.random() * this.mainCanvas.height,
      s: Math.random() * 2
    });
  }
}

SunMoon.arcPos = function (age, arcX, arcY, arcRadius) {
  var angle = Math.PI * (0.5 - age);
  var xo = Math.sin(angle) * arcRadius;
  var yo = Math.cos(angle) * arcRadius;
  var x = arcX - xo;
  var y = arcY - yo;

  return {
    x: x,
      y: y
  }
}

SunMoon.age = function(data) {
  var d = new Date();
  var now = d.getTime() / 1000;
  var lowerBound;

  for (i = 0; data[i]["unix_t"] < now; i++) {
    lowerBound = i;
  }

  if (data[lowerBound]["type"] == "rise") {
    r = data[lowerBound]["unix_t"];
    s = data[lowerBound+1]["unix_t"];
    return (now - r) / (s - r);
  }
  else {
    s = data[lowerBound]["unix_t"];
    r = data[lowerBound+1]["unix_t"];
    return ((now - s) / (r - s)) + 1.0;
  }
}

SunMoon.drawSun = function (ctx, x, y) {
  var radius = this.SUNMOON_RADIUS;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = 'yellow';
  ctx.fill();
}

SunMoon.drawMoon = function (ctx, x, y) {
  var radius = this.SUNMOON_RADIUS;

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

SunMoon.start = function() {
  this.mainCanvas = document.getElementById("main");
  this.cloudsCanvas = document.getElementById("clouds");
  this.randomiseStars();
  this.getData();
}

SunMoon.drawPhaseShadow = function(ctx, moonPos, moonRadius, phase) {
  var moonTop = moonPos.y - moonRadius;
  var moonBottom = moonPos.y + moonRadius;
  var maxControlOffset = moonRadius * 1.3; // Gives us a half circle
  var terminatorContOffset; 
  var outerContOffset;
  var shadowStyle = "rgba(0, 0, 0, 0.7)";

  ctx.strokeStyle = shadowStyle;
  ctx.fillStyle = shadowStyle;

  if (phase < 0.01 || phase > 0.99) {
    // New
    ctx.arc(moonPos.x, moonPos.y, moonRadius, 0, 2 * Math.PI, false);
    ctx.fill();
    return;
  }
  else if (phase < 0.25) {
    // First quarter crescent
    terminatorContOffset = moonPos.x + (maxControlOffset * (phase/0.25));
    outerContOffset = moonPos.x - maxControlOffset;
  }
  else if (phase < 0.49) {
    // First quarter gibbous
    terminatorContOffset = moonPos.x - (maxControlOffset * ((phase-0.25)/0.25));
    outerContOffset = moonPos.x - maxControlOffset;
  }
  else if (phase < 0.51) {
    // Full - no shadow required
    return;
  }
  else if (phase < 0.75) {
    // Last quarter gibbous
    terminatorContOffset = moonPos.x + (maxControlOffset * ((phase-0.5)/0.25));
    outerContOffset = moonPos.x + maxControlOffset;
  }
  else {
    // Last quarter crescent
    terminatorContOffset = moonPos.x - (maxControlOffset * ((phase-0.75)/0.25));
    outerContOffset = moonPos.x + maxControlOffset;
  }

  ctx.beginPath();

  // Terminator
  ctx.moveTo(moonPos.x, moonTop);
  ctx.bezierCurveTo(terminatorContOffset, moonTop, terminatorContOffset, moonBottom, moonPos.x, moonBottom);

  // Outer arc
  ctx.bezierCurveTo(outerContOffset, moonBottom-3, outerContOffset, moonTop+3, moonPos.x, moonTop);
  ctx.fill();
  ctx.stroke();
}
