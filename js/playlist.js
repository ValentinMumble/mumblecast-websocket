var TrackCollection = function(id, tracks){

	this.id = (id == undefined ? null : id);
	this.tracks = (tracks == undefined ? [] : tracks);

}

TrackCollection.prototype = {

	displayPlaylist : function(){
		var $tracks = $('#tracks');
		$tracks.empty();
		$.each(this.tracks, function(i, track){
			setTimeout(function(){
			displayTrack(track, $tracks);
    },( i * 100 ));
		});
	},

	scToMumble : function(tracks){

		var curr = this;
		$.each(tracks, function(key, track){

			var trackObject = {
				id : track.id,
				idSC : track.id,
				title : track.title,
				artworkUrl : track.artwork_url,
				artist : track.user.username
			};
			curr.addTrack(trackObject);
		});
		console.log(curr);
		curr.displaySearchList();

	},

	displaySearchList : function(){
		$tracks =  $('#search-tracklist');
		$.each(this.tracks, function(i, track){
			setTimeout(function(){
			displayTrack(track, $tracks);
    },( i * 500 ));
		});
	},
	
	getTrack : function(id){

		var trackObject = null;

		$.each(this.tracks, function(key, track){
			if (track.id == id)
				trackObject = track;
		});

		return trackObject;
	},

	addTrack : function(track){
		this.tracks.push(track);
	},

	removeTrack : function(trackId){
		var i = indexOfTrack(trackId, this);
		if (i) this.tracks.splice(i, 1);
		return i;
	}
}

var indexOfTrack = function(id, trackCollection) {
	for (var i = 0; i < trackCollection.tracks.length; i++) {
		if (trackCollection.tracks[i].id == id) return i;
	}
	return -1;
};
