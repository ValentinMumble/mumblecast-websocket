$(document).ready(function() {

  /* Constants. */

  var SOCKET_HOST = "54.187.163.215";
  var SOCKET_PORT = 3000;
  var CONSUMER_KEY = "d07779451ce9508678bdd995685ad9b0";
  var DEFAULT_ARTWORK_URLS = [
    "images/default_artwork_blue.png",
    "images/default_artwork_green.png",
    "images/default_artwork_grey.png",
    "images/default_artwork_orange.png",
    "images/default_artwork_purple.png",
    "images/default_artwork_red.png",
    "images/default_artwork_yellue.png"
  ];

  /* ------ Cast { ------ */

  var initializeCastApi = function() {
    cast.receiver.logger.setLevelValue(0);
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');
    
    castReceiverManager.onReady = function(event) {
      console.log('Received Ready event: ' + JSON.stringify(event.data));
      window.castReceiverManager.setApplicationState("Application status is ready...");
    };
    
    castReceiverManager.onSenderConnected = function(event) {
      console.log('Received Sender Connected event: ' + event.data);
      console.log(window.castReceiverManager.getSender(event.data).userAgent);
    };
    
    castReceiverManager.onSenderDisconnected = function(event) {
      console.log('Received Sender Disconnected event: ' + event.data);
      if (window.castReceiverManager.getSenders().length == 0) {
        //window.close();
      }
    };
    
    castReceiverManager.onSystemVolumeChanged = function(event) {
      console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' + event.data['muted']);
    };

    // create a CastMessageBus to handle messages for a custom namespace
    window.messageBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.mumble.mumblecast');

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

  /* Handle the data coming from the cast manager. */
  var handleData = function(data) {
    console.log(data);
  };

  /* ------ } Cast ------ */

  var tracks = [];
  var current = {index: -1, trackObject: null, sound: null, paused: false};
  var youtubePlayer = null;

  var getRandomDefaultArtworkUrl = function() {
    return DEFAULT_ARTWORK_URLS[Math.floor(Math.random() * DEFAULT_ARTWORK_URLS.length)];
  };

  var millisecondsToHms = function(d) {
    d = Number(d) / 1000;
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
  };

  var indexOfTrack = function(id) {
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].id == id) {
        return i;
      }
    }
    return -1;
  };

  var deleteTrack = function(id) {
    var i = indexOfTrack(id);
    if (i) tracks.splice(i, 1);
    return i;
  };

  var loadTrack = function(trackObject) {
    tracks.push(trackObject);
  };

  var clearPlayers = function() {
    /* Stop soundManager2 & destruct sound if any. */
    soundManager.stopAll();
    if (current.sound != null) {
      current.sound.destruct();
      current.sound = null;
    }
    /* Stop YouTube playing & loading. */
    youtubePlayer.stopVideo();
  };

  var playTrack = function(trackObject) {
    $(".disclaimer").fadeOut();
    clearPlayers();
    current.trackObject = trackObject;
    if (trackObject.provider == "soundcloud") {
      playSoundCloudTrack(trackObject);
    } else if (trackObject.provider == "youtube") {
      playYouTubeTrack(trackObject);
    }
    current.paused = false;
    socket.emit("track playing", trackObject.id);
  };

  var playSoundCloudTrack = function(trackObject) {
    $(".player").not("#soundcloudPlayer").hide();
    var $soundcloudPlayer = $("#soundcloudPlayer").addClass("hidden").show();
    var $elapsed = $soundcloudPlayer.find(".elapsed").text("");
    var $remaining = $soundcloudPlayer.find(".remaining").text("");
    var $comment = $soundcloudPlayer.find(".comment").text("");
    SC.get("/tracks/" + trackObject.trackId, function(track, error){
      var artworkUrl = track.artwork_url == null ? getRandomDefaultArtworkUrl() : track.artwork_url.replace("large", "t300x300");
      var $artwork = $soundcloudPlayer.find(".artwork");
      if ($artwork.attr("src") != artworkUrl) {
        $artwork.addClass("hidden").attr("src", artworkUrl).load(function() { $artwork.removeClass("hidden"); });
      }
      $soundcloudPlayer.find(".title").text(track.title);
      $soundcloudPlayer.find(".user").text(track.user.username);
      $soundcloudPlayer.removeClass("hidden");

      var defaultColor = "#222";
      var loadedColor = "#2A2A2A";
      var playedColor = "#ff6600";

      $("#waveform").empty();
      var waveform = new Waveform({
        container: $("#waveform")[0],
        innerColor: defaultColor
      });

      waveform.dataFromSoundCloudTrack(track);
      var options = waveform.optionsForSyncedStream({
        defaultColor: defaultColor,
        loadedColor: loadedColor,
        playedColor: playedColor
      });

      options.onfinish = playNext;
      var wp = options.whileplaying;
      options.whileplaying = function() {
        wp();
        $elapsed.text(millisecondsToHms(this.position));
        // +1 because of soundManager2 HTML5 bug
        $remaining.text("-" + millisecondsToHms(this.duration - this.position + 1));
      };
      options.ontimedcomments = function(comments) {
        $comment.text(comments[0].user.username + ": " + comments[0].body);
      };

      SC.stream(track.uri, options, function(sound){
        current.sound = sound;
        current.sound.play();
      });
    });
  };

  var playYouTubeTrack = function(trackObject) {
    $(".player").not("#youtubePlayer").hide();
    $("#youtubePlayer").addClass("hidden").show();
    youtubePlayer.loadVideoById(trackObject.trackId);
    $("#youtubePlayer").removeClass("hidden");
  };

  var pauseTrack = function() {
    if (current.trackObject != null) {
      if (current.trackObject.provider == "soundcloud") {
        current.sound.togglePause();
        $(".cover .overlay").toggleClass("paused");
        current.paused = !current.paused;
      } else if (current.trackObject.provider == "youtube") {
        current.paused ? youtubePlayer.playVideo() : youtubePlayer.pauseVideo();
        current.paused = !current.paused;
      }
      if (current.paused) {
        socket.emit("paused");
      } else {
        socket.emit("unpaused");
      }
    }
  };

  var playNext = function() {
    if (current.index < tracks.length - 1) {
      current.index++;
      playTrack(tracks[current.index]);
    }
  };

  var playPrevious = function() {
    if (current.index > 0) {
      current.index--;
      playTrack(tracks[current.index]);
    }
  };

  /* ------ Socket { ------ */

  /* Connection to the node/websockets server. */
  var socket = io.connect("http://" + SOCKET_HOST + ":" + SOCKET_PORT);

  /* Initial set of tracks, loop through and add to list. */
  socket.on("initial tracks", function(data) {
    for (var i = 0; i < data.length; i++) {
      loadTrack(data[i]);
    }

    /* Initialize YouTube player. */
    youtubePlayer = new YT.Player('youtubePlaceholder', {
      playerVars: {
        autoplay: 1,
        controls: 0
      },
      events: {
        onStateChange: function(event) {
          if (event.data === 0) playNext();
        }
      }
    });
  });

  /* When the server tells to add this track. */
  socket.on("new track", function(trackObject) {
    loadTrack(trackObject);
  });

  /* When the server tells to delete this track. */
  socket.on("delete track", function(id) {
    var deletedId = deleteTrack(id);
    if (deletedId <= current.index) current.index--;
  });

  /* When the server tells to play this track. */
  socket.on("play track", function(id) {
    current.index = indexOfTrack(id);
    playTrack(tracks[current.index]);
  });

  /* When the server tells to pause the current track. */
  socket.on("pause", pauseTrack);

  /* When the server tells to play the next track. */
  socket.on("next", playNext);

  /* When the server tells to play the previous track. */
  socket.on("previous", playPrevious);

  /* ------ } Socket ------ */

  /* ------ Main ------ */

  initializeCastApi();

  SC.initialize({
    client_id: CONSUMER_KEY
  });

  soundManager.setup({
    useHTML5Audio: true,
    preferFlash: false,
  });

  socket.emit("i am receiver");

});