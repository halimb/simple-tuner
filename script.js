"use strict"
var context, source;
var connected = false;

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

var btn = document.getElementById("btn");
btn.onclick = function() {
	if(connected) {
		//CONNECT
		source.disconnect();
		connected = false;
		document.body.className = "off";
	} else {
		//DISCONNECT
		source.connect(context.destination);
		connected = true;
		document.body.className = "on";
	}
}

