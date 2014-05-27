var Track = function(id, title, user, artworkUrl){

  this.id         = (id == undefined ? null : id);
  this.provider   = null;
  this.idProvider = null;

  this.title    = null;
  this.user     = null;
  this.duration = null;

  this.artworkUrl = null;
  this.waveform   = null;

}