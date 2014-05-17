$(document).ready(function() {

  /* Constants. */
  var SOCKET_HOST = "54.187.163.215";
  var DEFAULT_ARTWORK_URLS = [
    "images/default_artwork_blue.png",
    "images/default_artwork_gray.png",
    "images/default_artwork_green.png",
    "images/default_artwork_orange.png",
    "images/default_artwork_purple.png",
    "images/default_artwork_red.png",
    "images/default_artwork_yellow.png"
  ];

  /* Connection to the node/websockets server. */
  var socket = io.connect("http://" + SOCKET_HOST + ":3000");

  var getRandomDefaultArtworkUrl = function() {
    return DEFAULT_ARTWORK_URLS[Math.floor(Math.random() * DEFAULT_ARTWORK_URLS.length)];
  };

  var submitTrack = function() {
    var track = $("#trackInput").val();
    if (validate(track)) {
      $("#trackInput").val("");
      loadTrack({provider: "soundcloud", trackId: track}, true);
    }
  };

  var validate = function(track) {
    if (track == "") {
      displayAlert("Empty value!");
      return false;
    }
    return true;
  };

  var loadTrack = function(trackObject, broadcast) {
    /* Immediately clear any alert. */
    clearAlert(0);
    $("#loading").fadeIn("fast");
    SC.get("/tracks/" + trackObject.trackId, function(track, error){
      $("#loading").fadeOut("fast");
      if (error) {
        console.log(error);
        displayAlert(error.message);
      } else {
        if (broadcast) socket.emit("new track", trackObject);
        var artworkUrl = track.artwork_url == null ? getRandomDefaultArtworkUrl() : track.artwork_url;
        $("#tracks").append('<div class="track"><div class="artwork" style="background-image:url(' + artworkUrl + ')"></div><span class="title">' + track.title + '</span> &mdash; <span class="user">' + track.user.username + '</span>');
      }
    });
  };

  var displayAlert = function(message) {
    $("#alertContent").html(message);
    $("#alert").fadeIn("fast");
    setTimeout(clearAlert, 3000);
  };

  var clearAlert = function(time) {
    $("#alert").fadeOut(time, function() {
      $("#alertContent").html("");
    });
  };

  /* Initial set of tracks, loop through and add to list. */
  socket.on("initial tracks", function(data){
    for (var i = 0; i < data.length; i++) {
      loadTrack(data[i], false);
    }
  });

  /* New track received from the socket, append it to our list of current tracks. */
  socket.on("new track", function(data) {
    loadTrack(data, false);
  });

  /* New socket connected. */
  socket.on("users connected", function(data) {
    $("#usersConnected").html("users connected: " + data);
  });

  $("#newTrack").click(submitTrack);
  $("#trackInput").keypress(function(e) {
    if (e.which == 13) {
      submitTrack();
    }
  });

  /* -------- Main -------- */

  /* Start by initializing SoundCloud. */
  SC.initialize({
    client_id: "d07779451ce9508678bdd995685ad9b0"
  });

});
