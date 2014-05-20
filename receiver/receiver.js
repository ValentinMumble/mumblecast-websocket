$(document).ready(function() {

  /* Cast */

  var initializeCast = function() {
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
      userConnected(window.castReceiverManager.getSender(event.data).userAgent);
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

  /* Constants. */
  var SOCKET_HOST = "54.187.163.215";
  var SOCKET_PORT = 3000;
  var DEFAULT_ARTWORK_URL = "images/default_artwork.png";

  var queue = [];
  var index = -1;
  var currentSound = null;

  /* Handle the data coming from the cast manager. */
  var handleData = function(data) {
    console.log(data);
  };

  var trackAt = function(id) {
    var i = 0;
    while (i < queue.length) {
      if (queue[i].id == id) {
        return queue[i];
      }
      i++;
    }
    return false;
  };

  var loadTrack = function(trackObject) {
    queue.push(trackObject);
  };

  var playTrack = function(id) {
    var trackObject = trackAt(id);
    if (trackObject) {
      SC.stream("/tracks/" + trackObject.trackId, function(sound) {
        if (currentSound != null) currentSound.stop();
        currentSound = sound;
        currentSound.play();
      });
      displayTrack(trackObject);
    }
  };

  var displayTrack = function(trackObject) {
    SC.get("/tracks/" + trackObject.trackId, function(track, error){
      var $currentTrack = $("#currentTrack");
      var artworkUrl = track.artwork_url == null ? DEFAULT_ARTWORK_URL : track.artwork_url.replace("large", "crop");
      $currentTrack.find(".artwork").css("background-image", "url(" + artworkUrl + ")");
      $currentTrack.find(".title").text(track.title);
      $currentTrack.find(".user").text(track.user.username);
      $currentTrack.fadeIn();
    });
  };

  /* Connection to the node/websockets server. */
  var socket = io.connect("http://" + SOCKET_HOST + ":" + SOCKET_PORT);

  /* Initial set of tracks, loop through and add to list. */
  socket.on("initial tracks", function(data){
    for (var i = 0; i < data.length; i++) {
      loadTrack(data[i]);
    }
  });

  socket.on("play track", function(id) {
    playTrack(id);
  });

  /* Main */

  //initializeCast();

  SC.initialize({
    client_id: "d07779451ce9508678bdd995685ad9b0"
  });

  socket.emit("i am receiver", "");

});