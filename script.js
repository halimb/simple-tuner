"use strict"
var context, source;
var connected = false;
var interval = 0;
var c = document.getElementById("cnv");
var ctx = c.getContext("2d");
var frequencies;
if(navigator.mediaDevices) {
	navigator.mediaDevices
	.getUserMedia({audio: true, video: false})
	.then( function(stream) {
		context = 	new (window.AudioContext || 
			  				 window.webkitAudioContext);
		source = context.createMediaStreamSource(stream);
		//source.connect(context.destination);
		//connected = true;
		console.log(context);
		console.log(source);
	})
}

var display = document.getElementById("display");
display.onclick = function() {
	if(connected) {
		//CONNECT
		source.disconnect();
		connected = false;
		document.body.className = "off";
		animDown();
	} else {
		//DISCONNECT
		//source.connect(context.destination);
		connected = true;
		document.body.className = "on";

		var analyser = context.createAnalyser();
		analyser.fftSize = 2048;
		source.connect(analyser);
		analyser.smoothingTimeConstant = .85;
		console.log(analyser);
		frequencies = 
			new Float32Array(analyser.frequencyBinCount);
		var barWidth = c.width / frequencies.length;
		anim();
	}

	function anim() {
		if(connected) {
			analyser.getFloatFrequencyData(frequencies);
			// var summedFreq = 
			// 	new Float32Array(analyser.frequencyBinCount);
			// analyser.getFloatFrequencyData(summedFreq);
			// for(var i = 0; i < 4; i++) {
			// 	for(j = 0; j < frequencies.length; j++) {
			// 		analyser.getFloatFrequencyData(frequencies);
			// 		summedFreq[i] += frequencies[i]
			// 	}
			// 	if(i == 3) {
			// 		for(var j = 0; j < frequencies.length; j++) {
			// 			summedFreq[j] /= 3;
			// 		}
			// 	}
			// }
			var sum = 0;
			var index = 0;
			c.width = c.width;
			var max = -120;
			for(var i  = 0; i < frequencies.length; i++) {
				var freq = frequencies[i];
				if(freq > max) {
					max = freq;
					index = i;
				}
				freq = Math.exp(Math.sqrt(freq * -1/3.5));
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.fillRect(i * barWidth, 
							freq,
							barWidth + 1, 
							c.height - freq ); 
			}
			display.innerHTML = parseInt(22050 / 1024 * index) + "Hz";
			window.requestAnimationFrame(anim);
		}
	}
	var barHeight = -1;
	function animDown() {
		c.width = c.width;
		var barWidth = c.width / frequencies.length;
		for(var i = 0; i < frequencies.length; i++) {
			var freq = frequencies[i] + 5;
			frequencies[i] = freq;
			ctx.fillStyle = "rgb(0,0,0)";
			ctx.fillRect(i * barWidth, 
						freq * -2, 
						barWidth + 1, 
						freq * -2 );
		}
		//barHeight++;
		if(frequencies[0] < 120) {
			window.requestAnimationFrame(animDown);
		}
	}
}