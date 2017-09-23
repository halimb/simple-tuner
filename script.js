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
var c = document.getElementById("cnv");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ox = c.width / 2;
var oy = c.height / 2;
var ctx = c.getContext("2d");
var ballRad = 6;
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
	ox = c.width / 2;
	oy = c.height / 2;
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
	delta = WAD.getDelta();
	drawDisc(ringRad);
	showDelta();
	window.requestAnimationFrame(anim);
}

function showDelta() {
	var start = startAngle;
	var end = endAngle;

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

	animateBall(delta);
}

function drawDisc(radius) {
	ctx.fillStyle = "#fff"
	ctx.beginPath();
	ctx.ellipse( ox, oy, 
				 radius, radius, 
				 0, 0, 2 * Math.PI);
	ctx.fill();
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
	var rad = ballRad * (1 - 1.5 * Math.abs(delta));
	ctx.ellipse( bx, by, rad, rad,
				 0, 0, 2 * Math.PI);
	ctx.fill();
	if( Math.abs(theta - prevTheta) > step ) {
		window.requestAnimationFrame(animateBall)
	}
}

var max = 0;