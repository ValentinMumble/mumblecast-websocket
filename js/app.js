$(document).ready(function() {

  /* Constants. */
  var SOCKET_HOST = "54.187.163.215";
  var SOCKET_PORT = 3000;
  var DEFAULT_ARTWORK_URLS = [
    "images/default_artwork_blue.png",
    "images/default_artwork_gray.png",
    "images/default_artwork_green.png",
    "images/default_artwork_orange.png",
    "images/default_artwork_purple.png",
    "images/default_artwork_red.png",
    "images/default_artwork_yellow.png"
  ];
  var SPEED = 100;

  /* Connection to the node/websockets server. */
  var socket = io.connect("http://" + SOCKET_HOST + ":" + SOCKET_PORT);

  var getRandomDefaultArtworkUrl = function() {
    return DEFAULT_ARTWORK_URLS[Math.floor(Math.random() * DEFAULT_ARTWORK_URLS.length)];
  };

  var displayAlert = function(message) {
    $("#alertContent").html(message);
    $("#alert").fadeIn(SPEED);
    setTimeout(clearAlert, 3000);
  };

  var clearAlert = function(time) {
    $("#alert").fadeOut(time, function() {
      $("#alertContent").html("");
    });
  };

  var submitTrack = function() {
    var track = $("#trackInput").val();
    if (validate(track)) {
      $("#trackInput").val("");
      $("#loading").fadeIn(SPEED);
      /* Check that the track is valid. */
      SC.get("/tracks/" + track, function(t, error){
        $("#loading").fadeOut(SPEED);
        if (error) {
          displayAlert(error.message);
        } else {
          socket.emit("new track", {provider: "soundcloud", trackId: track});
        }
      });
    }
  };

  var validate = function(track) {
    if (track == "") {
      displayAlert("Empty value!");
      return false;
    }
    return true;
  };

  var loadTrack = function(trackObject) {
    /* Immediately clear any alert. */
    clearAlert(0);
    $("#loading").fadeIn(SPEED);
    var $track = $("<div />").css("display", "none").attr("class", "track");
    $("#tracks").append($track);
    SC.get("/tracks/" + trackObject.trackId, function(track, error){
      $("#loading").fadeOut(SPEED);
      if (error) {
        displayAlert(error.message);
        $track.remove();
      } else {
        $track.attr("id", trackObject.id);
        var artworkUrl = track.artwork_url == null ? getRandomDefaultArtworkUrl() : track.artwork_url;
        var $artwork = $("<div />").attr("class", "artwork").css("background-image", "url(" + artworkUrl + ")");
        var $controls = $("<div />").attr("class", "controls");
        var $playButton = $("<button />").attr("class", "play");
        var $deleteButton = $("<button />").attr("class", "delete");
        $controls.append($playButton).append($deleteButton);

        $track.append($artwork);
        $track.append('<span class="title">' + track.title + '</span> &mdash; <span class="user">' + track.user.username + '</span>');
        $track.append($controls);
        $track.slideDown(SPEED);
      }
    });
  };

  var deleteTrack = function(objectId) {
    $("#" + objectId).slideUp(SPEED, function() { $(this).remove(); });
  };

  /* Initial set of tracks, loop through and add to list. */
  socket.on("initial tracks", function(data){
    for (var i = 0; i < data.length; i++) {
      loadTrack(data[i]);
    }
  });

  /* New track received from the socket, append it to our list of current tracks. */
  socket.on("new track", function(trackObject) {
    loadTrack(trackObject);
  });

  socket.on("delete track", function(id) {
    deleteTrack(id);
  });

  socket.on("track playing", function(id) {
    $(".playing").removeClass("playing");
    $("#" + id).addClass("playing");
  });

  /* New client connected. */
  socket.on("clients connected", function(data) {
    $("#usersConnected").html("clients connected: " + data);
  });
  
  socket.on("receiver connected", function() {
    displayAlert("receiver connected");
  });
  
  socket.on("receiver disconnected", function() {
    $(".playing").removeClass("playing");
    displayAlert("receiver disconnected");
  });

  $("#newTrack").click(submitTrack);
  $("#trackInput").keypress(function(e) {
    if (e.which == 13) {
      submitTrack();
    }
  });

  $("#tracks").on("click", ".delete", function() {
    socket.emit("delete track", $(this).parents(".track").attr("id"));
  });

  $("#tracks").on("click", ".play", function() {
    socket.emit("play track", $(this).parents(".track").attr("id"));
  });

  /* -------- Main -------- */

  /* Start by initializing SoundCloud. */
  SC.initialize({
    client_id: "d07779451ce9508678bdd995685ad9b0"
  });
  
  socket.emit("hello");

});
