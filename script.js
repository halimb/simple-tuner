"use strict"
// Analyser and animation
var index = 0;
var interval = 0;
var connected = false;
var barColor = "rgb(100,255,100)";//"rgb(48,187,48)";
var context, source, analyser, 
	frequencies, barWidth, delta,
	barHeight, prevTheta = 0, lastNote = 0;

// Canvas
var w = window.innerWidth;
var h = window.innerHeight;
var c = document.getElementById("canvas");
var vis = document.getElementById("visualization");
var ctx = c.getContext("2d");
var ctxVis = vis.getContext("2d");
c.width = w;
c.height = h;
vis.width = w;
vis.height = h;
var ox = w / 2;
var oy = h / 2;
var dim = Math.max( h, w );
var ballRad = dim * .0075;
var ringRad = dim * .12;
var ringWidth = ringRad / 35;
var visRadius = ringRad * 3.25;
var startAngle = Math.PI / 3;
var endAngle = 2 * Math.PI / 3;
var angleStep = Math.PI / 9;
var discColor = "#fff";
var ringColor = "#cfc";

var display = document.getElementById("display");

window.onresize = function() {
	w = window.innerWidth;
	h = window.innerHeight
	c.width = w;
	c.height = h;
	vis.width = w;
	vis.height = h;
	ox = w / 2;
	oy = h / 2;
};


(function init() {
	if(navigator.mediaDevices) {
		navigator.mediaDevices
		.getUserMedia({audio: true, video: false})
		.then( tune )
	}
})();

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

	lastNote = noteName;
	display.innerHTML = noteName;

	//Visualization
	c.width = c.width;
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
		freq = frequencies[i] * 2;
		barWidth = 4 * vis.width / len;
		barHeight = visRadius + freq;
		ctxVis.fillStyle = barColor;
		ctxVis.translate(ox, oy); 
		ctxVis.rotate(step);
		ctxVis.translate(-ox, -oy); 
		ctxVis.fillRect(ox, oy, barWidth, barHeight );
	}
	delta = WAD.getDelta();
	drawDisc(ringRad);
	showDelta();
	window.requestAnimationFrame(anim);
}

function showDelta() {
	var start = 0//startAngle;
	var end = Math.PI * 2//endAngle;

	for(var i = 0; i < ringWidth; i += .5) {
		ctx.strokeStyle = ringColor;
		ctx.beginPath();
		ctx.ellipse( ox, oy, ringRad - i, ringRad - i, 
					 Math.PI, start, end );
		ctx.stroke();		
	}
	ctx.fillStyle = "#78c";
	ctx.beginPath();
	ctx.ellipse(ox, oy - ringRad, 3, 3, 0, 0, 2 * Math.PI);
	ctx.fill();
	
	showNotes(7);

	animateBall(delta);
}

function showNotes(range) {
	ctx.fillStyle = "#000";
	for(var i = -range + 1; i < range; i++) {
		if( i== 0 ) { continue; }
		// get coefficient depending on the index
		var coef =  Math.sqrt(4 * Math.abs(i));
		// Font settings
		ctx.textAlign = i > 0 ? "left" : "right";
		ctx.font = Math.round(30 / Math.sqrt(coef)) + "px Roboto-B";
		
		var note = WAD.getNeighbour(i);
		var pos = getNotePosition(i, coef);
		ctx.fillText( note, pos.x, pos.y );
		var x = i > 0 ? ox + pos.dx : ox - pos.dx;
		drawBall( x, pos.y, ballRad / coef);
	}
}

function getNotePosition(index, coef) {
	var pos = {};
	// set angle and position
	var theta = startAngle - angleStep * coef;
	pos.y = oy - Math.sin( theta ) * ringRad;
	pos.dx = Math.cos( theta )  * ringRad;
	pos.x = index > 0 ? ox + pos.dx + 5 * Math.sqrt( coef )
					  : ox - pos.dx - 5 * Math.sqrt( coef );
	return pos;
}

function drawBall(x, y, rad) {
	ctx.beginPath();
	ctx.ellipse( x, y, rad, rad, 0, 0, Math.PI * 2);
	ctx.fill();
}

function drawDisc(radius) {
	ctx.fillStyle = discColor;
	drawBall( ox, oy, radius);
}

function animateBall() {
	//Ball angle
	var step = .01;
	var arc = ( endAngle - startAngle ) / 2;
	var theta = Math.PI / 2 - 2 * delta * arc;
	var sign = theta - prevTheta;
	prevTheta += step * sign;
	var bx = ox + Math.cos(prevTheta) * ringRad;
	var by = oy - Math.sin(prevTheta) * ringRad;
	ctx.fillStyle = "#000";
	ctx.beginPath();
	var rad = ballRad //* (1 - 1 * Math.abs(delta));
	ctx.ellipse( bx, by, rad, rad,
				 0, 0, 2 * Math.PI);
	ctx.fill();
	if( Math.abs(theta - prevTheta) > step ) {
		window.requestAnimationFrame(animateBall)
	}
}

var max = 0;