"use strict"
// Analyser and animation
var index = 0;
var interval = 0;
var connected = false;
var barColor = "rgb(255,255,255)";//"rgb(48,187,48)";
var context, source, analyser, 
	frequencies, barWidth, 
	barHeight, lastNote = 0;

// Canvas
var c = document.getElementById("cnv");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ctx = c.getContext("2d");

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
	var pitch = autoCorrelate(timeDomain, context.sampleRate);
	var note = noteFromPitch( pitch );
	var noteName = pitchesArray[note - 12] || lastNote;
	lastNote = noteName;
	display.innerHTML = noteName;
	

	//Visualization
	c.width = c.width;
	var freq;
	var sum = 0;
	var max = -120;
	var ox = c.width / 2;
	var oy = c.height / 2;
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
	window.requestAnimationFrame(anim);
}