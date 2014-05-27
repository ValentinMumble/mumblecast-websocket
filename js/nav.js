var displayTrack = function(track, container){

  var $track   = $("<div />", { id : track.id, class : "track" });
  var $artwork = $("<img />", { class : "artwork img-circle", src : track.artworkUrl });

  var $trackDetails = $("<div />", {class: "track-details"});

  var $title   = $("<div />", { class : "title", text : track.title });
  var $user    = $("<div />", { class : "user", text : track.artist });

  $trackDetails.append($title, $user);
  
  var $controls     = $("<div />", { class : "controls" });
  var $playButton   = $("<button />", { class : " play", html :'<i class="fa fa-play"></i>'});
  var $deleteButton = $("<button />", { class : " delete", html :'<i class="fa fa-trash-o"></i>'});

  var $testButton = $("<button />", { class : "test-button", text:'test' });

  $controls.append($playButton, $deleteButton);
  $track.append($artwork, $trackDetails, $controls);
  //$track.append($title, $user, $controls);
  $trackWrapper = $('<div />', {class : "track-wrapper"});
  
  $trackControls = $('<div />', {class : "track-controls", text : "test"});
  $trackWrapper.append($track, $trackControls);
  container.append($trackWrapper);

  $track.offset();
  $trackWrapper.addClass("display");
}
$(document).ready(function(){

$('#tracks').on('click', '.test-button', function(){

  $('.track').removeClass('show-track-menu');
  $('.track-controls').removeClass('show-track-menu');
  $parentTrack = $(this).parents(".track");
  $controls = $parentTrack.parents(".track-wrapper").children('.track-controls');

  $controls.addClass("show-track-menu");
  $parentTrack.addClass("show-track-menu");

});

$(".show-menu").on('click', function(){

  //$('.content').toggleClass('displaymenu');
  $('#inner-wrap').toggleClass('displaymenu');
  //$('.track').removeClass('show-track-menu');
 $('.show-menu img').toggleClass('hidden');
  $('.menu-wrap').toggleClass('displaymenu');
})

});