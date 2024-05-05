//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;
	stopButton.disabled = false;

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//update the format 
		// document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;

	//reset button just in case the recording is stopped while paused

	
	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(processAudio);
}

function processAudio(blob) {
	let requestLanguage = document.getElementById('request-lang-selector').value;
	let responseLanguage = document.getElementById('response-lang-selector').value;
	fetch('http://localhost:8080/audio', {
		method: 'POST',
		body: blob,
		headers: {
			"requestLanguage": requestLanguage,
			"responseLanguage": responseLanguage,
			"content-type": "application/json"
		}
	})
	.then(response => {
		if (response.ok) {
			return response.json();
		} else {
			console.log(response.status);
			console.error('Failed to upload file');
		}
	})
	.then(data => {
		// Log the responseLanguage field
		playAudio(data)
		appendTextExchange(data)
	})
	.catch(error => {
		console.error('Error uploading file:', error);
	});
}

function appendTextExchange(audioResponse) {
	const requestText = document.createElement('p');
  
  // Set some text content for the paragraph
  requestText.textContent = audioResponse.requestText;
	document.getElementById('you-table').appendChild(requestText);

	const responseText = document.createElement('p');
  
  // Set some text content for the paragraph
  responseText.textContent = audioResponse.responseText;
	document.getElementById('teacher-table').appendChild(responseText);
}

function playAudio(audioResponse) {
	const binaryData = atob(audioResponse.audioData);
  const arrayBuffer = new ArrayBuffer(binaryData.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < binaryData.length; i++) {
    view[i] = binaryData.charCodeAt(i);
  }
  const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });

  // Create a URL for the Blob object
  const url = URL.createObjectURL(blob);

  // Get the audio element and set its source to the created URL
  const audioPlayer = document.getElementById('audioPlayer');
  audioPlayer.src = url;
  
}
