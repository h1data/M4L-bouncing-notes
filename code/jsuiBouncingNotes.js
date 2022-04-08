/**
 * @fileoverview jsui script for bouncing notes Max for Live device
 * @version 1.0.0
 * @author h1data
 * @license CC BY-SA https://creativecommons.org/licenses/by-sa/4.0/legalcode
 */

// jsui parameters
autowatch = 1;
inlets = 1;
outlets = 1;

// initialize mgraphics
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// constants
var TWOPI = 2 * Math.PI;
var MAX_S = 0.66;
var MAX_B = 0.85;
var BALL_SIZE = 5;
var width = 242;
var height = 96;
var DELTA_X = 0.048; // 48px/sec

var xOffset = - 2.0 * BALL_SIZE / DELTA_X;
var xOffsetInv = width + BALL_SIZE;
var xMod = width + 2.0 * BALL_SIZE;
var xModInv = xMod / DELTA_X;
var yOffset = 2 * BALL_SIZE;
var yMod = height + BALL_SIZE;

// global parameters
var notes = new Array(128);
var g_inactive = false;
var g_velRatio = 20.0; // idk why did i define this m/msec...
var g_minimum = 50.0; // msec
var g_gravity = 9.81;
var g_inverse = false;
var g_saturation = MAX_S;
var g_brightness = MAX_B;

paint.local = 1;
function paint() {
  if (g_inactive) return;
  var now = Date.now();
  with (mgraphics) {
    // y = (v*t - 0.5 * g*t*t) * g * h / (0.5 * 127^2 * velRatio^2)
    var yMultiple = (height - 3 * BALL_SIZE) / (8064.5  * (g_velRatio * g_velRatio));
    for (i in notes) {
      if (notes[i] != undefined) {
        if (g_inverse) {
          var x = xOffsetInv - ((now - notes[i].noteBegin) * DELTA_X ) % xMod;
        } else {
          var x = ((now - notes[i].noteBegin) * DELTA_X ) % xMod - BALL_SIZE;
        }
        var t = now - notes[i].bounceBegin;
        var y = ((0.5 * notes[i].gravity * t - notes[i].velocity) * t
                * notes[i].gravity * yMultiple - yOffset) % yMod + height;
        set_source_rgb(notes[i].color);
        arc(x, y, BALL_SIZE, 0, TWOPI);
        fill();
      }
    }
  } 
}

function bang() {
  mgraphics.redraw();
}
 
function active(attr) {
  g_inactive = (attr != 1);
  if (g_inactive) mgraphics.redraw();
}

function fgcolor(r, g, b, a) {
  var max = Math.max(r, g, b);
  if (max == 0) {
    g_saturation = 0;
    g_brightness = 0;
  } else {
    g_saturation = Math.min((max - Math.min(r, g, b)) / max, MAX_S);
    g_brightness = Math.min(max, MAX_B);
  }
  for (i in notes) {
    if (notes[i] != undefined) {
      notes[i].color = hsvToRgb(notes[i].hue, g_saturation, g_brightness);
    }
  }
}

function noteon(note, velocity) {
  var hue = Math.random();
  notes[note] = {
    hue: hue,
    color: hsvToRgb(hue, g_saturation, g_brightness),
    noteBegin: Date.now() + xOffset,
  }
}

function noteonvelocity(note, velocity) {
  if (notes[note] != undefined) {
    notes[note].velocity = Math.max(velocity * g_velRatio, 0.5 * g_gravity * g_minimum);
    notes[note].bounceBegin =  Date.now();
    notes[note].gravity = g_gravity;
  }
}

function noteoff(note) {
  notes[note] = undefined;
}

function velocity(attr) {
  g_velRatio = attr;
}

function gravity(attr) {
  g_gravity = attr;
}

function inverse(attr) {
  g_inverse = (attr == 1);
  var now = Date.now();
  for (i in notes) {
    if (notes[i] != undefined) {
      notes[i].noteBegin = now + (now  - notes[i].noteBegin) % xModInv - xModInv;
    }
  }
}

function minimum(attr) {
  g_minimum = attr;
}

hsvToRgb.local = 1;
function hsvToRgb(h, s, v) {
  var c = v * s;
  var hp = h * 6.0;
  var x = c * (1 - Math.abs(hp % 2 - 1));
  var m = v - c;

  if (0 <= hp && hp < 1) {
    return [m + c, m + x, m];
  } else if (1 <= hp && hp < 2) {
    return [m + x, m + c, m];
  } else if (2 <= hp && hp < 3) {
    return [m, m + c, m + x];
  } else if (3 <= hp && hp < 4) {
    return [m, m + x, m + c];
  } else if (4 <= hp && hp < 5) {
    return [m + x, m, m + c];
  } else if (5 <= hp && hp < 6) {
    return [m + c, m, m + x];
  }
}
