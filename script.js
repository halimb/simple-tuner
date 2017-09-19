"use strict"
var context, source;
var connected = false;
var interval = 0;
var c = document.getElementById("cnv");
c.height = window.innerHeight;
c.width = window.innerWidth;
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
		//analyser.fftSize = 4096;
		source.connect(analyser);
		// analyser.maxDecibels = -10;
		// analyser.minDecibels = -120;
		// analyser.smoothingTimeConstant = .85;
		console.log(analyser);
		frequencies = 
			new Float32Array(analyser.frequencyBinCount);
		var barWidth = c.width / frequencies.length;
		anim();
	}

	var index = 0;
	var lastNote = "0";
	function anim() {
		if(connected) {
			var timeDomain = new Uint8Array(analyser.fftSize);
			analyser.getByteTimeDomainData(timeDomain);
			var pitch = autoCorrelate(timeDomain, context.sampleRate);
			var note = noteFromPitch( pitch );
			var noteName = pitchesArray[note - 12] || lastNote;
			lastNote = noteName;
			display.innerHTML = noteName;
			//updateBackground();
			window.requestAnimationFrame(anim);
			
			analyser.getFloatFrequencyData(frequencies);

			var sum = 0;
			var prevIndex = 0;
			var freq;
			c.width = c.width;
			var max = -120;
			var step = 2 * Math.PI / frequencies.length;
			for(var i  = 0; i < frequencies.length; i++) {
				freq = frequencies[i];
				if(freq > max) {
					max = freq;
					index = i;	
					prevIndex = index;
				}
				sum += prevIndex;
				freq = Math.exp(Math.sqrt(freq * -1/3.5)) / 2;
				while(freq > 150) {
					freq /= 2;
				}
				ctx.fillStyle = "rgb(0,0,0)";
				// ctx.fillRect(i * barWidth, 
				//  			freq,
				//  			barWidth + 1, 
				//  			c.height - freq );
				ctx.translate(c.width / 2, c.height / 2); 
				ctx.rotate(step);
				ctx.translate( - c.width / 2, - c.height / 2); 
				ctx.fillRect(c.width / 2, 
							c.height / 2,
							barWidth + 1, 
							freq ); 
			}
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

// function updateBackground() {
// 	if(delta) {
// 		var d = parseInt(Math.abs(delta * 1.5 * 255));
// 		console.log(d);
// 		var r = d * 3;
// 		var g = 255 - d;
// 		var b = parseInt(Math.sqrt(d)); 
// 		console.log(color);
// 		var color = "rgb(" + r + ", " + g + ", " + b + ")";
// 		document.body.style.backgroundColor = color;
// 		console.log(document.body.style.backgroundColor);
// 	}
// }

    


///////////////////////////////////////
// var input = new Wad({ source: "mic"});
// var tuner = new Wad.Poly();
// tuner.add(input);
// input.playable = 0;
// input.play();

// tuner.updatePitch();
// var logPitch = function(){
//     console.log(tuner.pitch, tuner.noteName)
//     requestAnimationFrame(logPitch)
// };
// logPitch();