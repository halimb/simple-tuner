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
	function anim() {
		if(connected) {
			analyser.getFloatFrequencyData(frequencies);
		

			var sum = 0;
			var prevIndex = 0;
			var freq;
			c.width = c.width;
			var max = -120;
			for(var i  = 0; i < frequencies.length; i++) {
				freq = frequencies[i];
				if(freq > max) {
					max = freq;
					index = i;	
					prevIndex = index;
				}
				sum += prevIndex;
				freq = Math.exp(Math.sqrt(freq * -1/3.5));
				ctx.fillStyle = "rgb(0,0,0)";
				ctx.fillRect(i * barWidth, 
							freq,
							barWidth + 1, 
							c.height - freq ); 
			}
			//console.log(frequencies);
			var timeDomain = new Uint8Array(analyser.fftSize);
			analyser.getByteTimeDomainData(timeDomain);
			var peak = autoCorrelate(timeDomain, context.sampleRate);
			//var rawFreq = parseInt(44100 / 2048 * (sum / frequencies.length));
			display.innerHTML = peak//rawFreq //- rawFreq % 10 + "Hz";
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

    function autoCorrelate( buf, sampleRate ) {
        var MIN_SAMPLES = 4;    // corresponds to an 11kHz signal
        var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
        var SIZE = 1000;
        var best_offset = -1;
        var best_correlation = 0;
        var rms = 0;
        var foundGoodCorrelation = false;

        if (buf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
            return -1;  // Not enough data

        for ( var i = 0; i < SIZE; i++ ) {
            var val = ( buf[i] - 128 ) / 128;
            rms += val * val;
        }
        rms = Math.sqrt(rms/SIZE);
        if (rms<0.01)
            return -1;

        var lastCorrelation=1;
        for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
            var correlation = 0;

            for (var i=0; i<SIZE; i++) {
                correlation += Math.abs(((buf[i] - 128)/128)-((buf[i+offset] - 128)/128));
            }
            correlation = 1 - (correlation/SIZE);
            if ((correlation>0.9) && (correlation > lastCorrelation))
                foundGoodCorrelation = true;
            else if (foundGoodCorrelation) {
                // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
                return sampleRate/best_offset;
            }
            lastCorrelation = correlation;
            if (correlation > best_correlation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        }
        if (best_correlation > 0.01) {
            // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
            return sampleRate/best_offset;
        }
        return -1;
    //  var best_frequency = sampleRate/best_offset;
    }

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