
var pdf_h = 0;
var pdf_w = 0;
var mouse_factor = 1;
var playback_volume = 0.8;

var mj_live = new MJ.live();

// /////////////////////////////////////////////////////////////////////////////
// ui part
// 
if (global_info.biz_type === 'live') {
	// TODO:
	// $("#live_controller").show();
	playback_bar_info_hide();
	$("#start_stop_record").hide();
	var media_container = document.getElementById('media_container');
	media_container.style.paddingTop = '10px';
	media_container.style.height = (media_container.clientHeight - 20) + 'px';

	$("#volume").show();
	$("#volume_bar_bg").show();
	$("#volume_bar_1").show();
	$("#volume_bar_2").show();
} else if (global_info.biz_type === 'playback') {
	// TODO:
	$("#player").hide();
	$("#start_stop_record").hide();
	$('#controls').hide();
} else if (global_info.biz_type === 'record') {
	playback_bar_info_hide();
	$("#player").hide();
	var media_container = document.getElementById('media_container');
	media_container.style.paddingTop = '10px';
	media_container.style.height = (media_container.clientHeight - 20) + 'px';

	init_live_pub();
}

function playback_bar_info_hide() {
	$("#play_pause").hide();
	$("#seek_bar").hide();
	$("#seek_bar_1").hide();
	$("#seek_bar_2").hide();
	$("#volume").hide();
	$("#volume_bar_bg").hide();
	$("#volume_bar_1").hide();
	$("#volume_bar_2").hide();
	$("#curr_pos").hide();
	$("#video_xiegang").hide();
	$("#range").hide();
	$("#video1").hide();
}

if (document.webkitIsFullScreen === undefined) {
	var full_screen = document.getElementById('full_screen');
	full_screen.style.display = 'none';
}

document.getElementById('teacher_name').textContent = global_info.teacher_name;

function resize_splitter() {
	var splitter = document.getElementById('splitter');
	var splitter_btn = document.getElementById('splitter_btn');

	splitter.style.height = window.innerHeight + "px";
	splitter_btn.style.top = (splitter.clientHeight / 2 - splitter_btn.clientHeight / 2)
			+ 'px';
}

function resize_right_panel() {
	var right_panel = document.getElementById('right_panel');
	var banner = document.getElementById('banner');
	var history_msg = document.getElementById('historyMsg');
	var controls = document.getElementById('controls');

	history_msg.style.height = (right_panel.clientHeight - banner.clientHeight
			- controls.clientHeight - 5 - 20 - 20)
			+ 'px';
}

function resize_left_panel() {
	var left_panel = document.getElementById('left_panel');
	var info_container = document.getElementById('info_container');
	var whiteboard_container = document.getElementById('whiteboard_container');
	var media_container = document.getElementById('media_container');

	whiteboard_container.style.height = (window.innerHeight - 20 - 20
			- info_container.clientHeight - media_container.clientHeight)
			+ 'px';

	var canvas = document.getElementById('the-canvas');

	var bili = pdf_w > pdf_h ? pdf_h/pdf_w : pdf_w/pdf_h;
	
	if(whiteboard_container.clientHeight / whiteboard_container.clientWidth <= bili) {
		canvas.style.height = (whiteboard_container.clientHeight - 20) + 'px';
		canvas.style.width = (whiteboard_container.clientHeight- 20) / bili	+ 'px';
		canvas.style.top = (whiteboard_container.clientHeight / 2 - 10 - canvas.clientHeight / 2)
				+ 'px';
	} else {
		canvas.style.width = (whiteboard_container.clientWidth - 20) + 'px';
		canvas.style.height = (whiteboard_container.clientWidth- 20) * bili + "px";
		canvas.style.top = (whiteboard_container.clientHeight / 2 - 10 - canvas.clientHeight / 2)
				+ 'px';
	}

	mouse_factor = pdf_w / canvas.clientWidth;

	if (global_info.biz_type === 'playback') {
		resize_left_panel_playback();
	} else if (global_info.biz_type === 'record') {

	} else if (global_info.biz_type === 'live') {

	}
}

function resize_left_panel_playback() {
	var whiteboard_container = document.getElementById('whiteboard_container');
	var seek_bar_1 = document.getElementById('seek_bar_1');
	var seek_bar_2 = document.getElementById('seek_bar_2');
	var seek_bar_bg = document.getElementById('seek_bar_bg');
	seek_bar_1.style.width = (whiteboard_container.clientWidth) + 'px';
	seek_bar_bg.style.width = (whiteboard_container.clientWidth) + 'px';
	seek_bar_2.style.left = '0px';
}

function resize_panel() {
	var win_w = window.innerWidth;
	var win_h = window.innerHeight;
	var left_panel = document.getElementById('left_panel');
	var right_panel = document.getElementById('right_panel');

	left_panel.style.height = win_h - 20 + 'px';
	right_panel.style.height = win_h - 20 + 'px';

	left_panel.style.width = (win_w - 10 - 10 - 10 - right_panel.clientWidth)
			+ 'px';
}

function resize_panel_fullscreen() {
	var win_w = window.innerWidth;
	var win_h = window.innerHeight;
	var left_panel = document.getElementById('left_panel');
	var right_panel = document.getElementById('right_panel');

	left_panel.style.height = win_h - 20 + 'px';
	left_panel.style.width = (win_w - 10) + 'px';
}

function resize_live_publish() {
	var live_publish = document.getElementById('live_publish');
	// live_publish.style.left = (window.innerWidth / 2 - 215 / 2) + 'px';
	// live_publish.style.top = (window.innerHeight / 2 - 138 / 2) + 'px';
	live_publish.style.position = 'absolute';
	live_publish.style.left = '0px';
	live_publish.style.top = '0px';
	live_publish.style.backgroundColor = 'rgb(255,0,0)';
	live_publish.style.width = window.innerWidth + 'px';
	live_publish.style.height = window.innerHeight + 'px';
	live_publish.style.zIndex = 1000;

	var rtmpLiveEncoder = document.getElementById('RtmpLiveEncoder');
	rtmpLiveEncoder.style.left = (window.innerWidth / 2 - 215 / 2) + 'px';
	rtmpLiveEncoder.style.top = (window.innerHeight / 2 - 138 / 2) + 'px';
	rtmpLiveEncoder.style.width = window.innerWidth + 'px';
	rtmpLiveEncoder.style.height = window.innerHeight + 'px';
}

function onresize() {
	console.log('onresize');
	if (!document.webkitIsFullScreen) {
		resize_panel();
		resize_left_panel();
		resize_right_panel();
		resize_splitter();
	} else {
		resize_panel_fullscreen();
		resize_left_panel();
	}

	if (!user_access_mic && global_info.biz_type === 'record') {
		resize_live_publish();
	}

	resize_vol();
}

window.addEventListener('resize', onresize, false);

function init_vol_bar() {
	for (var i = 0; i < 10; i++) {
		var index_ele = document.getElementById('vol_' + i);
		index_ele.style.backgroundColor = 'rgb(239,239,239)';
	}
}

function init_user_num() {
	var number_users = document.getElementById('number_users');
	number_users.textContent = '0';
}

function onActivityLevel(level) {
	// console.log(level);
	var index = parseInt(Number(level / 10).toFixed(0));

	for (var i = 0; i < 10; i++) {
		var index_ele = document.getElementById('vol_' + i);
		if (i >= index) {
			index_ele.style.backgroundColor = 'rgb(239,239,239)';
		} else {
			index_ele.style.backgroundColor = 'rgb(42,210,168)';
		}
	}
}

function resize_vol() {
	onActivityLevel(playback_volume * 100);

	var volume_bar_bg = document.getElementById('volume_bar_bg');
	var volume_bar_1 = document.getElementById('volume_bar_1');
	var volume_bar_2 = document.getElementById('volume_bar_2');
	volume_bar_1.style.width = volume_bar_bg.clientWidth * playback_volume
			+ 'px';
	volume_bar_2.style.left = volume_bar_1.clientWidth - 5 + 'px';
}

function flash_ok() {
	console.log('flash_ok');
	if (global_info.biz_type === 'record') {

	} else if (global_info.biz_type === 'live') {
		var player_id = document.getElementById('player_id');
		var volume = player_id.get_volume();
		var volume_bar_bg = document.getElementById('volume_bar_bg');
		var volume_bar_1 = document.getElementById('volume_bar_1');
		var volume_bar_2 = document.getElementById('volume_bar_2');
		volume_bar_1.style.width = volume_bar_bg.clientWidth * volume + 'px';
		volume_bar_2.style.left = volume_bar_1.clientWidth - 5 + 'px';

		onActivityLevel(volume * 100);

		console.log('volume' + volume);

	} else if (global_info.biz_type === 'playback') {

	}	
}

window.onload = function() {
	console.log('onload');
	// onresize();

	init_vol_bar();

	init_user_num();
	
	setTimeout(function(){
		console.log('settimeout');
		onresize();
		document.getElementById('teacher_body').style.visibility = 'visible';
		document.getElementById('teacher_body').style.zIndex = 0;	
	}, 1000);
	
}

function click_splitter_btn() {
	var right_panel = document.getElementById('right_panel');
	var left_panel = document.getElementById('left_panel');
	var splitter_btn = document.getElementById('splitter_btn');

	if (right_panel.style.display !== 'none') {
		right_panel.style.display = 'none';

		left_panel.style.width = (window.innerWidth - 10 - 10) + 'px';
		splitter_btn.src = 'img/splitter_btn_back.png';

	} else {
		left_panel.style.width = (window.innerWidth - 270 - 10 - 10 - 10)
				+ 'px';
		right_panel.style.display = 'block';
		splitter_btn.src = 'img/splitter_btn.png';
	}

	onresize();
}

document.getElementById('splitter_btn').addEventListener('click',
		click_splitter_btn);

function click_full_screen() {
	var left_panel = document.getElementById('left_panel');

	if (!document.webkitIsFullScreen) {
		left_panel.webkitRequestFullScreen();
	} else {
		document.webkitCancelFullScreen();
	}
}

function cancel_full_screen() {
	var left_panel = document.getElementById('left_panel');
	var full_screen = document.getElementById('full_screen');

	if (!document.webkitIsFullScreen) {
		left_panel.style.float = 'left';
		full_screen.src = 'img/fullscreen.png';
	} else {
		left_panel.style.float = 'none';
		full_screen.src = 'img/restore_screen.png';
	}

	onresize();
}

document.getElementById('left_panel').addEventListener(
		'webkitfullscreenchange', cancel_full_screen, false);
document.getElementById('full_screen').addEventListener('click',
		click_full_screen);
