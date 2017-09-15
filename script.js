"use strict"
var context, source;
var connected = false;
var interval = 0;

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

		window.clearInterval(interval);

	} else {
		//DISCONNECT
		source.connect(context.destination);
		connected = true;
		document.body.className = "on";

		var analyser = context.createAnalyser();
		analyser.fftSize = 256;
		source.connect(analyser);
		var frequencies = 
			new Float32Array(analyser.frequencyBinCount);

		interval = window.setInterval(
			function(){
				analyser.getFloatFrequencyData(frequencies)
				console.log(frequencies);
				var sum = 0;
				for(var i  = 0; i < frequencies.length; i++) {
					sum += frequencies[i];
				}
				console.log(sum / frequencies.length);
			},
			1000);
	}
}

