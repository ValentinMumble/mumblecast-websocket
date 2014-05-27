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
var CURR_PLAYLIST = new TrackCollection();

$(document).ready(function() {

  hideNavBarOnScroll();

  /* Connection to the node/websockets server. */
  var socket = io.connect("http://" + SOCKET_HOST + ":" + SOCKET_PORT);

  /* Initial set of tracks, loop through and add to list.*/
  socket.on("initial tracks", function(data){

    for (var i = 0; i < data.length; i++) {

      var trackObject = data[i];

      if(trackObject.artworkUrl == null){
        trackObject.artworkUrl = getRandomDefaultArtworkUrl();
      }
      
      CURR_PLAYLIST.addTrack(trackObject);

    }
      CURR_PLAYLIST.displayPlaylist();
  });

  /* New track received from the socket, append it to our list of current tracks. */
  socket.on("track added", function(trackObject) {
      displayTrack(trackObject, $('#tracks'));
  });

  socket.on("track deleted", function(id) {
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
  

  socket.on("paused", function(paused) {
    if(paused)
      $('#control-bar > div.control-button.play').html('<i class="fa fa-play"></i>');
    else
      $('#control-bar > div.control-button.play').html('<i class="fa fa-pause"></i>');
  });

  socket.on("receiver disconnected", function() {
    $(".playing").removeClass("playing");
    displayAlert("receiver disconnected");
  });

/* User inputs */  


  $("#tracks").on("click", ".delete", function() {
    socket.emit("delete track", $(this).parents(".track").attr("id"));
  });

  $("#tracks").on("click", ".play", function() {
    socket.emit("play track", $(this).parents(".track").attr("id"));
  });

  $("#control-bar").on("click", ".next", function() {
    socket.emit("next", $(this).parents(".track").attr("id"));
  });

  $("#control-bar").on("click", ".play", function() {
    socket.emit("pause", $(this).parents(".track").attr("id"));
  });

  $("#control-bar").on("click", ".previous", function() {
    socket.emit("previous", $(this).parents(".track").attr("id"));
  });

/* Tracks controller */

var loadTrack = function(trackObject) {

  /* Immediately clear any alert. */
  clearAlert(0);

  var result = {test: "test"};
  var $container = $("#tracks");

  SC.get("/tracks/" + trackObject.trackId, function(SCtrack, error){
    
    if(error) {
      displayAlert(error.message);
    } else {
      track = {
        id : trackObject.id,
        idSC : trackObject.trackId,
        title : SCtrack.title,
        artworkUrl : SCtrack.artwork_url == null ? getRandomDefaultArtworkUrl() : SCtrack.artwork_url,
        username : SCtrack.user.username
      }
      displayTrack(track, $container);
    }
  });
};

var validate = function(track) {
  if (track == "") {
    displayAlert("Empty value!");
    return false;
  }
  return true;
};

  $("#search-input").bind("keyup",function(){

    var $searchInput = $(this);

    var searchResults = new TrackCollection();

    SC.get('/tracks', { q: $searchInput.val() }, function(tracks) {
      $('#search-tracklist').empty();
      searchResults.scToMumble(tracks);
      console.log(tracks);
    });
  });

$('#search-tracklist').unbind('click').on('click', '.track', function(){
  var id = $(this).attr('id');

   SC.get("/tracks/" + id, function(t, error){
    if (error) {
      displayAlert(error.message);
    } else {
      var track = {
        provider :"soundcloud",
        providerId : id,
        title : t.title,
        artist : t.user.username,
        artworkUrl : t.artwork_url,
        waveformUrl : t.waveform_url,
        duration : t.duration
      };
      socket.emit("new track", track);

    }
  });

});

  /* -------- Main -------- */

  /* Start by initializing SoundCloud. */
  SC.initialize({
    client_id: "d07779451ce9508678bdd995685ad9b0"
  });
  socket.emit("hello");

});

var getRandomDefaultArtworkUrl = function() {
  return DEFAULT_ARTWORK_URLS[Math.floor(Math.random() * DEFAULT_ARTWORK_URLS.length)];
};

/* Alert controller */

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

var deleteTrack = function(objectId) {
  $("#" + objectId).closest('.track-wrapper').slideUp(SPEED, function() { $(this).remove(); });
  CURR_PLAYLIST.removeTrack(objectId);
};

var hideNavBarOnScroll = function(){
  /* scroll direction boolean */
  var up = false;

  /*container scroll position*/
  var position = $("#inner-wrap").scrollTop(); // should start at 0

  $("#inner-wrap").scroll(function(){

    var scroll = $("#inner-wrap").scrollTop();

    if(position > 50){

      if(scroll >= position && !up) {
          $(".topnavbar").addClass('scroll-hide');
          $("#control-bar").addClass('scroll-hide');
          up = !up;
      } else if(scroll < position && up){
          $(".topnavbar").removeClass('scroll-hide');
          $("#control-bar").removeClass('scroll-hide');
          up = !up;
      }

    }
    position = scroll;
  });
};