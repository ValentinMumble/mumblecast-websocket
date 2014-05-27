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
      /*
        $(".topnavbar").css({ 
          transform: 'translate3d(0px, '+navBarPosition+'px, 0)'
        });*/
var SPEED = 100;
var currentPlaylist = new TrackCollection();
$(document).ready(function() {

  var navBarPosition = 0;
  var dir = "down";
  var currPos = $("#inner-wrap").scrollTop();
  var position = $("#inner-wrap").scrollTop(); // should start at 0
  $("#inner-wrap").scroll(function(e){
    var scroll = $("#inner-wrap").scrollTop();
    if(scroll >= position) {
      //down
      if(dir == "up"){
        currPos = $("#inner-wrap").scrollTop()+50;
        dir = "down";
      }
      navBarPosition = currPos-position;
      console.log(navBarPosition);
      console.log(dir);

    } else {

      if(dir == "down"){
        currPos = $("#inner-wrap").scrollTop()+50;
        dir = "up";
      }
      console.log(dir);
      navBarPosition = currPos-position;
      console.log(navBarPosition);

    }
      if(navBarPosition >= 0){
        navBarPosition = 0;
      }
      else if(navBarPosition <= -50){
        navBarPosition = -50;
      }

      if(scroll <= 50){
        navBarPosition = 0;
      }

        $(".topnavbar").css({ 
          transform: 'translate3d(0px, '+navBarPosition+'px, 0)'
        });
        $("#control-bar").css({
          transform: 'translate3d(0px, '+(-navBarPosition)+'px, 0)'
        });

    position = scroll;
  });

  /* Connection to the node/websockets server. */
  var socket = io.connect("http://" + SOCKET_HOST + ":" + SOCKET_PORT);

  /* Initial set of tracks, loop through and add to list.*/
  socket.on("initial tracks", function(data){

    for (var i = 0; i < data.length; i++) {

      var trackObject = data[i];

      if(trackObject.artworkUrl == null){
        trackObject.artworkUrl = getRandomDefaultArtworkUrl();
      }
      
      currentPlaylist.addTrack(trackObject);

    }
      currentPlaylist.displayPlaylist();
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

  $("#search-input").unbind("change keyup").bind("change keyup",function(){

    $('#search-tracklist').empty();
    var $searchInput = $(this);

    var searchResults = new TrackCollection();

    SC.get('/tracks', { q: $searchInput.val() }, function(tracks) {
      searchResults.scToMumble(tracks);
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

$("#submitTrackForm").unbind('submit').on('submit',function(){

  var dataForm = $(this).serializeArray();
  var searchTerm = dataForm['0'].value;
  SC.get("/tracks/" + searchTerm, function(t, error){
    if (error) {
      displayAlert(error.message);
    } else {

      var track = {
        provider :"soundcloud",
        providerId : searchTerm,
        title : t.title,
        artist : t.user.username,
        artworkUrl : t.artwork_url,
        waveformUrl : t.waveform_url,
        duration : t.duration
      };

      console.log(track);
      socket.emit("new track", track);

    }
  });

  return false;
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
  $("#" + objectId).slideUp(SPEED, function() { $(this).remove(); });
  console.log(currentPlaylist);
  currentPlaylist.removeTrack(objectId);
  console.log(currentPlaylist);
};
