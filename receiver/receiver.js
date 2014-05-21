$(document).ready(function() {

  /* Constants. */
  var SOCKET_HOST = "54.187.163.215";
  var SOCKET_PORT = 3000;
  var DEFAULT_ARTWORK_URL = "images/default_artwork.png";

  /* Cast */

  var initializeCastApi = function() {
    cast.receiver.logger.setLevelValue(0);
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');
    
    // handler for the 'ready' event
    castReceiverManager.onReady = function(event) {
      console.log('Received Ready event: ' + JSON.stringify(event.data));
      window.castReceiverManager.setApplicationState("Application status is ready...");
    };
    
    // handler for 'senderconnected' event
    castReceiverManager.onSenderConnected = function(event) {
      console.log('Received Sender Connected event: ' + event.data);
      console.log(window.castReceiverManager.getSender(event.data).userAgent);
    };
    
    // handler for 'senderdisconnected' event
    castReceiverManager.onSenderDisconnected = function(event) {
      console.log('Received Sender Disconnected event: ' + event.data);
      if (window.castReceiverManager.getSenders().length == 0) {
        window.close();
      }
    };
    
    // handler for 'systemvolumechanged' event
    castReceiverManager.onSystemVolumeChanged = function(event) {
      console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' + event.data['muted']);
    };

    // create a CastMessageBus to handle messages for a custom namespace
    window.messageBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.mumble.mumblecast');

    // handler for the CastMessageBus message event
    window.messageBus.onMessage = function(event) {
      console.log('Message [' + event.senderId + ']: ' + event.data);
      // display the message from the sender
      handleData(event.data);
      window.castReceiverManager.setApplicationState(event.data);
      // inform all senders on the CastMessageBus of the incoming message event
      // sender message listener will be invoked
      window.messageBus.send(event.senderId, event.data);
    }

    // initialize the CastReceiverManager with an application status message
    window.castReceiverManager.start({statusText: "Application is starting"});
    console.log('Receiver Manager started');
  };

  var tracks = [];
  var index = -1;
  var currentSound = null;

  /* Handle the data coming from the cast manager. */
  var handleData = function(data) {
    console.log(data);
  };

  var indexOfTrack = function(id) {
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].id == id) {
        return i;
      }
    }
    return false;
  };

  var deleteTrack = function(id) {
    var i = indexOfTrack(id);
    if (i) tracks.splice(i, 1);
  };

  var loadTrack = function(trackObject) {
    tracks.push(trackObject);
  };

  var playTrack = function(trackObject) {
    if (trackObject) {
      SC.stream("/tracks/" + trackObject.trackId, function(sound) {
        if (currentSound != null) currentSound.stop();
        currentSound = sound;
        currentSound.play();
        console.log(sound);
      });
      displayTrack(trackObject);
    }
  };

  var displayTrack = function(trackObject) {
    var $currentTrack = $("#currentTrack").fadeOut();
    SC.get("/tracks/" + trackObject.trackId, function(track, error){
      var artworkUrl = track.artwork_url == null ? DEFAULT_ARTWORK_URL : track.artwork_url.replace("large", "crop");
      $currentTrack.find(".artwork").hide().attr("src", artworkUrl).load(function() { $(this).fadeIn(); });
      $currentTrack.find(".title").text(track.title);
      $currentTrack.find(".user").text(track.user.username);
      $currentTrack.stop().fadeIn();
      console.log("playing track: " + track.title);
    });
  };

  /* Connection to the node/websockets server. */
  var socket = io.connect("http://" + SOCKET_HOST + ":" + SOCKET_PORT);

  /* Initial set of tracks, loop through and add to list. */
  socket.on("initial tracks", function(data) {
    for (var i = 0; i < data.length; i++) {
      loadTrack(data[i]);
    }
    //playTrack(tracks[0]);
  });

  socket.on("new track", function(trackObject) {
    loadTrack(trackObject);
  });

  socket.on("delete track", function(id) {
    deleteTrack(id);
  });

  socket.on("play track", function(id) {
    playTrack(tracks[indexOfTrack(id)]);
  });

  /* Main */

  initializeCastApi();

  SC.initialize({
    client_id: "d07779451ce9508678bdd995685ad9b0"
  });

  SC.whenStreamingReady(function() {
    soundManager.setup({
      useHTML5Audio: true,
      preferFlash: false
    });
    console.log(soundManager.html5);
  });

  socket.emit("i am receiver");

});