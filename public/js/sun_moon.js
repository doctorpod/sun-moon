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
  cover: 0,
  top: 0,
  bottom: 0,
  data: []
};

SunMoon.draw = function () {
  var ctx = this.canvas.getContext("2d");
  var lineX = this.canvas.height * 0.5;
  var lineStart = this.canvas.width * 0.1;
  var lineEnd = this.canvas.width * 0.9;
  var arcRadius = this.canvas.height * 0.618 * 0.5;
  var arcX = this.canvas.width / 2.0;
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

  this.randomiseClouds(this.canvas.width * 0.35, this.canvas.height * 0.35, this.canvas.width * 0.3, this.canvas.height * 0.05, this.data["weather"]["clouds"]["all"]/100.0);

  // Clear
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.paintBackground(ctx, sunAge, sunPos, this.canvas.width, this.canvas.height);

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
  this.drawClouds(ctx);
  this.drawRain(
    ctx, 
    this.canvas.width * 0.35, 
    this.canvas.height * 0.42, 
    this.canvas.width * 0.3, 
    this.canvas.height * 0.05, 
    this.evaluateRain()
  );
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

SunMoon.randomiseClouds = function(x, y, width, height, cover) {
  if (cover == this.clouds.cover) {
    return;
  }

  var maxR = height * 0.4,
      minR = height * 0.1;
      boxArea = width * height;
  var cloudR, cloudX, cloudY;

  this.clouds.cover = cover;
  this.clouds.top = y;
  this.clouds.bottom = y + height;
  this.clouds.data = [];

  for(area = 0; area < (boxArea * cover); ) {
    cloudR = (Math.random() * (maxR - minR)) + minR;
    cloudX = (Math.random() * width) + x;
    cloudY = (Math.random() * height) + y;

    this.clouds.data.push({ x: cloudX, y: cloudY, r: cloudR });
    area = area + ((2 * cloudR) * (2 * cloudR));
  }
}

SunMoon.drawClouds = function(ctx) {
  var cloudX, cloudY, cloudR;
  var grdLinear = ctx.createLinearGradient(0, this.clouds.top, 0, this.clouds.bottom);

  grdLinear.addColorStop(0.5, '#fff');
  grdLinear.addColorStop(1, '#aaa');

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
    this.stars.push(
        {
          x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      s: Math.random() * 2
        }
        );
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
  this.canvas = document.getElementById("clock");
  this.randomiseStars();
  this.getData();
  setInterval(this.getData.bind(SunMoon), 15000);
}

SunMoon.drawPhaseShadow = function(ctx, moonPos, moonRadius, phase) {
  var moonTop = moonPos.y - moonRadius;
  var moonBottom = moonPos.y + moonRadius;
  var maxControlOffset = moonRadius * 1.3; // Gives us a half circle
  var terminatorContOffset; 
  var outerContOffset;
  var shadowStyle = "rgba(0, 0, 0, 0.75)";

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
