///////////////////////////////////////////////////////////////////////////////
// live part
// 
var MJ = MJ || {};
MJ.live = MJ.live || function(){};

MJ.live.prototype.play_live = function () {
	url = global_info.live_addr + '/' + global_info.course_id;
	console.log('play', url);

	$("#div_container").remove();

	var div_container = $("<div/>");
	$(div_container).attr("id", "div_container");
	$("#player").append(div_container);

	var player = $("<div/>");
	$(player).attr("id", "player_id");
	$(div_container).append(player);

	srs_player = new SrsPlayer("player_id", 1, 1);
	srs_player.on_player_ready = function() {
		this.play(url);
	};

	srs_player.start();
}

MJ.live.prototype.stop_live = function () {
	if (srs_player) {
		srs_player.stop();
		srs_player = null;
	}
}

MJ.live.prototype.start_playlive = function () {
	var course_id = global_info.course_id;

	this.play_live();

	socket.emit('start_playlive', {
		course_id : course_id
	});
}

MJ.live.prototype.stop_playlive = function () {
	var course_id = global_info.course_id;

	this.stop_live();

	socket.emit('stop_playlive', {
		course_id : course_id
	});
}