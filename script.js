"use strict"

// Analyser and animation
var connected = false;
var barColor = "#fff"//"rgb(100,255,100)";
var context, source, analyser, 
	frequencies, barWidth, delta, range = 7,
	barHeight, prevTheta = 0, lastNote = 0;
var display = document.getElementById("display");
var frq = document.getElementById("frequency");

// Canvas
var w = window.innerWidth;
var h = window.innerHeight;
var c = document.getElementById("canvas");
var vis = document.getElementById("visualization");
var ctx = c.getContext("2d");
var ctxVis = vis.getContext("2d");
var offPitchColor = "rgba(255, 0, 0, .1)";
var onPitchColor = "rgba(0, 255, 0, .5)"
var ringColor = "rgba(0,0,0,.1)";
var angleStep = Math.PI / 9;
var startAngle = Math.PI / 3;
var endAngle = 2 * Math.PI / 3;
var mobile, dim, ballRad, ringWidth, 
	ox, oy, visRadius, fontSize;

function init() {
	initValues();
	if(navigator.mediaDevices) {
		navigator.mediaDevices
		.getUserMedia({audio: true, video: false})
		.then( tune )
	}
}
window.setTimeout(init, 200);

function initValues() {
	w = window.innerWidth;
	h = window.innerHeight;
	mobile = w / h < .8 ? true : false;
	c.width = w;
	c.height = h;
	vis.width = w;
	vis.height = h;
	ox = w / 2;
	oy = h / 2;
	dim = Math.min( h, w );
	ballRad = mobile ? dim * .015 : dim * .0075;
	meanHeight = mobile ? dim * .25 : dim * .17;
	visRadius = dim * .003;
	ringWidth = 1//dim * .001;
	fontSize = mobile ? dim * .05 : dim * .04;
	display.style.fontSize = fontSize * 2 + "px";
}

window.onresize = initValues;


function tune( stream ) {
	context = new ( window.AudioContext 	|| 
			  			window.webkitAudioContext );
	source = context.createMediaStreamSource(stream);
	analyser = context.createAnalyser();
	analyser.smoothingTimeConstant = .9;
	source.connect(analyser);
	frequencies = 
		new Float32Array(analyser.frequencyBinCount);
	anim();
}
var meanHeight, sum;
function anim() {
	//Pitch recognition / note display
	var timeDomain = new Uint8Array(analyser.fftSize);
	analyser.getByteTimeDomainData(timeDomain);

	// < < <
	/* The following relies on code from:           *
	 *	 Web Audio DAW Library by Raphael Serota    *
	 * Author on GitHub: https://github.com/rserota *		
	 * GitHub repo: https://github.com/rserota/wad  */
	var pitch = WAD.autoCorrelate(timeDomain, context.sampleRate);
	var noteName = WAD.noteFromPitch( pitch ) || lastNote;
	// > > >

	sum = 0;
	
	//Visualization
	vis.width = vis.width;
	var freq, barHeight, barWidth;
	var sum = 0;
	var prevIndex = 0;
	var len = frequencies.length;
	var start = parseInt(len * .1);
	var end = parseInt(len * .3);
	var step = 2 * Math.PI / ( end - start );
	analyser.getFloatFrequencyData(frequencies);
	for(var i  = start; i < end; i++) {
		freq = dim / 4 + frequencies[i];
		freq += mobile ? 100 : 0;
		barWidth = mobile ? 12 * w / len : 4 * w / len;
		barHeight = visRadius * freq;
		ctxVis.fillStyle = barColor;
		ctxVis.translate(ox, oy); 
		ctxVis.rotate(step);
		ctxVis.translate(-ox, -oy); 
		ctxVis.fillRect(ox, oy, barWidth, barHeight );
		sum += barHeight;
	}

	meanHeight = Math.abs(sum / (end - start));

	// Display
	c.width = c.width;
	if(noteName != lastNote) {
		display.innerHTML = noteName;
		frq.innerHTML = Math.round(pitch) + " Hz";
	}
	lastNote = noteName;
	delta = WAD.getDelta();
	showDelta();
	window.requestAnimationFrame(anim);
}

function showDelta() {
	smoothAnim();
	showNotes(range);
}

function showNotes(range) {
	for(var i = -range + 1; i < range; i++) {
		if( i== 0 ) { continue; }
		// get coefficient depending on the index
		var coef =  getCoef(i);
		// Font settings
		ctx.textAlign = i > 0 ? "left" : "right";
		ctx.font = Math.round(fontSize / Math.sqrt(coef)) + "px Roboto-R";
		var note = WAD.getNeighbour(i);
		var pos = getNotePosition(i);
		ctx.fillText( note, pos.x, pos.y );
		var x = i > 0 ? ox + pos.dx : ox - pos.dx;
		drawBall( x, pos.y, ballRad / coef);
	}
}

function getNotePosition(index) {
	var pos = {};
	var coef = getCoef(index);
	// set angle and position
	var theta = startAngle - angleStep * coef;
	pos.y = oy - Math.sin( theta ) * meanHeight;
	pos.dx = Math.cos( theta )  * meanHeight;
	pos.x = index > 0 ? ox + pos.dx + 5 * Math.sqrt( coef )
					  : ox - pos.dx - 5 * Math.sqrt( coef );
	return pos;
}

function drawBall(x, y, rad) {
	ctx.beginPath();
	ctx.ellipse( x, y, rad, rad, 0, 0, Math.PI * 2);
	ctx.fill();
}

function smoothAnim() {
	move();
	function move() {
		// Cursor ball
		var step = .01;
		var arc = ( endAngle - startAngle ) / 2;
		var theta = Math.PI / 2 - 2 * delta * arc;
		var sign = theta - prevTheta;
		prevTheta += step * sign;
		var diff = theta - prevTheta;
		var bx = ox + Math.cos(prevTheta) * meanHeight;
		var by = oy - Math.sin(prevTheta) * meanHeight;
		var rad = ballRad;
		ctx.fillStyle = "#000";
		ctx.moveTo(bx, by);
		ctx.beginPath();
		ctx.ellipse( bx, by, rad, rad,
					 0, 0, 2 * Math.PI);
		ctx.moveTo(ox, oy);
		ctx.ellipse(ox, oy, meanHeight, meanHeight,
					0,  - prevTheta - .02,  -prevTheta + .02);
		ctx.fill();

		// Center pitch indicator ring
		var d = Math.abs(delta - diff);
		var a = Math.abs((1 - d) * .5) ;
		var g = parseInt(( 1 - d ) * 255);
		var pitchRingColor = "rgba(0, " + g +
								 ", 0, " + a + ")";
		var cursorRad =  ballRad * 6.5 * a;
		ctx.lineWidth = a * 7;
		ctx.strokeStyle = pitchRingColor;
		ctx.beginPath();
		ctx.ellipse( ox, oy - meanHeight, 
					cursorRad, cursorRad, 
						0, 0, 2 * Math.PI);
		ctx.stroke();

		// Main ring
		var f = Math.sqrt;
		var fact = -f(Math.abs(delta)) + 1;
		g = parseInt( fact * 255 );
		var mainRingColor = "rgba(0, " + g  + 
						", 0, " + fact * .35 + ")";
		ctx.lineWidth = 100;
		ctx.strokeStyle = mainRingColor;
		ctx.beginPath();
		ctx.ellipse( ox, oy, meanHeight, meanHeight, 
					 Math.PI, 0, Math.PI * 2 );
		ctx.stroke();
		if( Math.abs(diff) > step ) {
			window.requestAnimationFrame(move);
		}
	}
}

function getCoef(i) {
	return Math.sqrt(4 * Math.abs(i));
}
