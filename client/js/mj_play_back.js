// /////////////////////////////////////////////////////////////////////////////
// playback part
// 

var MJ = MJ || {};
MJ.playback = MJ.playback || function(){};

var is_pause = true;
var is_start_playback = false;
var interval_function = function () {
	var current_time = Number(document.getElementById("video1").currentTime)
			.toFixed(1);
	var duration = Number(document.getElementById("video1").duration)
			.toFixed(1);
	var whiteboard_container = document.getElementById('whiteboard_container');
	document.getElementById("curr_pos").innerHTML = get_time_str(current_time);
	document.getElementById("seek_bar_2").style.left = current_time / duration
			* (whiteboard_container.clientWidth) + 'px';

	if (document.getElementById("video1").ended) {
		clearInterval(interval_handler);
		interval_handler = null;
		console.log('ended');

		document.getElementById("seek_bar_2").style.left = 0 + 'px';
		seek_bar_2.style.display = 'block';
		document.getElementById('play_pause').src = 'img/play.png';

		is_pause = true;
		is_start_playback = false;
	}
}

MJ.playback.prototype.play_pause = function () {
	var course_id = global_info.course_id;
	var play_pause = document.getElementById('play_pause');

	if (!is_pause) {
		play_pause.src = 'img/play.png';
		is_pause = true;
		socket.emit('pause_resume_playback', {
			is_pause : is_pause
		});
		document.getElementById("video1").pause();
	} else {

		play_pause.src = 'img/pause.png';
		is_pause = false;

		var seek_bar_ele = document.getElementById("seek_bar_2");
		var seek_bar_value = seek_bar_ele.style.left;
		console.log('seek_bar_left', seek_bar_value);
		if (seek_bar_value === '0px') {

			pageNum = 1;
			queueRenderPage(pageNum);

			/*
			 * var pos = 0; socket.emit('seek_playback', { pos : pos });
			 */
			document.getElementById("video1").src = global_info.playback_addr;
			document.getElementById("video1").pause();
			document.getElementById("video1").play();
			interval_handler = setInterval(interval_function, 1000);
		} else {
			socket.emit('pause_resume_playback', {
				is_pause : is_pause
			});
			document.getElementById("video1").play();
		}
	}
}

MJ.playback.prototype.can_play = function () {
	document.getElementById("range").innerHTML = get_time_str(Math.round(document
			.getElementById("video1").duration));

	// var volume = document.getElementById('video1').volume;
	document.getElementById('video1').volume = playback_volume;

	var volume_bar_bg = document.getElementById('volume_bar_bg');
	var volume_bar_1 = document.getElementById('volume_bar_1');
	var volume_bar_2 = document.getElementById('volume_bar_2');
	volume_bar_1.style.width = volume_bar_bg.clientWidth
			* playback_volume + 'px';
	volume_bar_2.style.left = volume_bar_1.clientWidth - 5 + 'px';

	onActivityLevel(playback_volume * 100);

	if (!is_start_playback) {
		var total = (document.getElementById("video1").duration * 1000)
				.toFixed(0);
		socket.emit('start_playback', {
			course_id : global_info.course_id,
			total : total
		});
		is_start_playback = true;
	}
}

MJ.playback.prototype.init_play_back = function () {
	document.getElementById("video1").addEventListener("canplay", this.can_play);
	document.getElementById('play_pause').addEventListener('click', this.play_pause);

	// seek_bar seek
	if (global_info.biz_type === 'playback' || global_info.biz_type === 'live'
			|| global_info.biz_type === 'record') {

		function seek_bar_mouse_down(e) {
			console.log(e);
			seek_bar_2.style.left = e.offsetX - 5 + 'px';
			seek_bar_2.style.display = 'block';
			send_seek(e.offsetX - 5);
		}

		function seek_bar_mouse_up(e) {
			console.log(e);
			seek_bar_2.style.display = 'block';
			seek_bar_2.style.left = e.offsetX - 5 + 'px';
		}

		function send_seek(e) {
			var curr_x = e;
			var total = document.getElementById("video1").duration;
			var bili = curr_x
					/ document.getElementById('whiteboard_container').clientWidth;
			var pos = (total * bili).toFixed(0);
			console.log('pos', pos);
			socket.emit('seek_playback', {
				pos : pos * 1000
			});
			document.getElementById("curr_pos").innerHTML = get_time_str(Number(pos));
			document.getElementById("video1").currentTime = pos;
		}

		document.getElementById('seek_bar_bg').addEventListener('mousedown',
				seek_bar_mouse_down);
		document.getElementById('seek_bar_bg').addEventListener('mouseup',
				seek_bar_mouse_up);
		document.getElementById('seek_bar_1').addEventListener('mousedown',
				seek_bar_mouse_down);
		document.getElementById('seek_bar_1').addEventListener('mouseup',
				seek_bar_mouse_up);

		function volume_bar_mouse_down(e) {
			console.log(e);
			volume_bar_2.style.left = e.offsetX - 5 + 'px';
			volume_bar_2.style.display = 'block';
			send_volume_seek(e.offsetX - 5);
		}

		function volume_bar_mouse_up(e) {
			console.log(e);
			volume_bar_2.style.display = 'block';
			volume_bar_2.style.left = e.offsetX - 5 + 'px';
		}

		function send_volume_seek(e) {
			var curr_x = e;
			document.getElementById("volume_bar_1").style.width = curr_x + 'px';

			var total = 1.0;
			var seek_bar_bg_w = document.getElementById('volume_bar_bg').clientWidth;
			var bili = Number((curr_x / seek_bar_bg_w).toFixed(1));
			var pos = Number((total * bili).toFixed(2));

			if (global_info.biz_type === 'record') {
				// var rtmpLiveEncoder = document.getElementById('RtmpLiveEncoder');
				// rtmpLiveEncoder.set_volume(pos);
			} else if (global_info.biz_type === 'playback') {
				var video = document.getElementById('video1');
				playback_volume = pos;
				video.volume = pos;
				onActivityLevel(pos * 100);
			} else if (global_info.biz_type === 'live') {
				var player_id = document.getElementById('player_id');
				player_id.set_volume(bili);
				// console.log(total, seek_bar_bg_w, curr_x, bili, pos);
				onActivityLevel(pos * 100);
			}

		}

		document.getElementById('volume_bar_bg').addEventListener('mousedown',
				volume_bar_mouse_down);
		document.getElementById('volume_bar_bg').addEventListener('mouseup',
				volume_bar_mouse_up);
		document.getElementById('volume_bar_1').addEventListener('mousedown',
				volume_bar_mouse_down);
		document.getElementById('volume_bar_1').addEventListener('mouseup',
				volume_bar_mouse_up);
	}
}

var mj_playback = new MJ.playback();

mj_playback.init_play_back();
