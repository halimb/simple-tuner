"use strict"
// Analyser and animation
var index = 0;
var interval = 0;
var connected = false;
var barColor = "rgb(100,255,100)";//"rgb(48,187,48)";
var context, source, analyser, 
	frequencies, barWidth, 
	barHeight, lastNote = 0;

// Canvas
var c = document.getElementById("cnv");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ox = c.width / 2;
var oy = c.height / 2;
var ctx = c.getContext("2d");
var ballRad = 4;
var ringRad = 70;
var ringWidth = 2;
var startAngle = Math.PI / 9;
var endAngle = 8 * Math.PI / 9;
var discColor = "#fff";
var ringColor = "#5c5";

var display = document.getElementById("display");

window.onresize = function() {
	c.height = window.innerHeight;
	c.width = window.innerWidth;
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
	var freq;
	var sum = 0;
	var max = -120;
	var prevIndex = 0;
	var len = frequencies.length;
	var barWidth = 4 * c.width / len;
	var barHeight = 300 + freq;
	var start = parseInt(len * .1);
	var end = parseInt(len * .3);
	var step = 2 * Math.PI / ( end - start );
	analyser.getFloatFrequencyData(frequencies);


	for(var i  = start; i < end; i++) {
		freq = frequencies[i] * 2;
		ctx.fillStyle = barColor;
		ctx.translate(ox, oy); 
		ctx.rotate(step);
		ctx.translate(-ox, -oy); 
		ctx.fillRect(ox, oy,
					barWidth, 
					300 + freq );
	}
	var delta = WAD.getDelta();
	drawDisc(ringRad, delta);
	showDelta(delta);
	window.requestAnimationFrame(anim);
}

function showDelta(delta) {
	ctx.strokeStyle = ringColor;
	for(var i = 0; i < ringWidth; i += .5) {
		ctx.beginPath();
		ctx.ellipse( ox, oy, ringRad - i, ringRad - i, 
					 Math.PI, startAngle, endAngle );
		ctx.stroke();
	}
	var higherNote = WAD.getHigher();
	var lowerNote = WAD.getLower();
	var hx = ox + Math.cos(startAngle) * ringRad + 15;
	var hy = oy - Math.sin(startAngle) * ringRad; //+ 15;
	var lx = 2 * ox - hx;
	var ly = hy;
	ctx.font = "16px Roboto-B";
	ctx.textAlign = "center";
	ctx.fillStyle = "#000";
	ctx.fillText( higherNote, hx, hy );
	ctx.fillText( lowerNote, lx , ly );

	//Ball angle
	var arc = ( endAngle - startAngle ) / 2;
	var theta = Math.PI / 2 - 2 * delta * arc;
	var bx = ox + Math.cos(theta) * ringRad;
	var by = oy - Math.sin(theta) * ringRad;
	ctx.fillStyle = "#000";
	ctx.beginPath();
	ctx.ellipse( bx, by, ballRad, ballRad,
				 0, 0, 2 * Math.PI);
	ctx.fill();
}

function drawDisc(radius, delta) {
	var color = getColor(delta);
	//console.log(color);
	ctx.fillStyle = color
	ctx.beginPath();
	ctx.ellipse( ox, oy, 
				 radius, radius, 
				 0, 0, 2 * Math.PI);
	ctx.fill();
}

function getColor(delta) {
	console.log(delta);
	var d = Math.abs(delta);
	var r = 55 + Math.round(200 * 2.5 * d);
	var g = 100 + Math.round(200 * (2.5 * d - 1));
	var b = 0;
	return "rgb(" + r + ", " + g + ", " + b + ")";
}