var jf = require('jsonfile');
var config = require('./config');

var playback = module.exports
var interval_ms = 40;
var interval_handler = null;

// ///////////////////////////////////////////////////////////////////////////
//
// server
//

playback.start_playback_server = function (usernames) {
	var interval_function = function() {
		for ( var key in usernames) {
			var user_obj = usernames[key];

			if (user_obj.is_playback && !user_obj.is_pause) {
				user_obj.curr_ms += interval_ms;

				for (; user_obj.playback_index < user_obj.playback_data.length; user_obj.playback_index++) {
					var data_ = user_obj.playback_data[user_obj.playback_index];

					// console.log(data_.ts, user_obj.curr_ms);
					if (data_.ts <= user_obj.curr_ms) {
						user_obj.socket.emit(data_.type, data_.data);
					} else {
						break;
					}
				}

				for (; user_obj.playback_index1 < user_obj.playback_data1.length; user_obj.playback_index1++) {
					var data1_ = user_obj.playback_data1[user_obj.playback_index1];

					if (data1_.ts <= user_obj.curr_ms) {
						user_obj.socket.emit('new message', data1_.data);
					} else {
						break;
					}
				}

				if (user_obj.curr_ms >= user_obj.total_ms) {
					user_obj.is_playback = false;
					user_obj.playback_index = 0;
					user_obj.playback_index1 = 0;
					user_obj.curr_ms = 0;
				}

			} // if
		} // for
	};

	if (interval_handler == null) {
		interval_handler = setInterval(interval_function, interval_ms);
	}
}

playback.stop_playback_server = function () {
	if (interval_handler != null) {
		clearInterval(interval_handler);
		interval_handler = null;
	}
}

playback.control_start_playback = function(data, socket, course_cache, file_db) {

	console.log('start_playback', data);
	var user_obj = socket.user_obj;

	if(user_obj === undefined) {
		return ;
	}

	user_obj.playback_index = 0;
	user_obj.playback_index1 = 0;
	user_obj.curr_ms = 0;
	user_obj.course_id = data.course_id;

	var course_id = user_obj.course_id;

	if(course_cache[course_id] !== undefined) {
		user_obj.playback_data = course_cache[course_id].playback_data;
		user_obj.playback_data1 = course_cache[course_id].playback_data1;
		user_obj.total_ms = course_cache[course_id].total_ms;
		user_obj.is_playback = true;
		user_obj.is_pause = false;
		return;
	}

	file_db[course_id] = {};
	var path = config.prev_path + course_id ;
	file_db[course_id].file = path + '/' +course_id + '_0.json';
	file_db[course_id].file1 = path + '/' +course_id + '_1.json';
	file_db[course_id].file2 = path + '/' +course_id + '_2.mp4';

	// if no cache
	course_cache[course_id] = {};
	var total0_ms = 0;
	var total1_ms = 0;
	var total2_ms = data.total;
	var file = file_db[course_id].file;
	var file1 = file_db[course_id].file1;
	var file2 = file_db[course_id].file2;

	console.log('readfile', file);
	console.log('readfile1', file1);

	jf.readFile(file, function(err, obj) { // read file
		if(err) {
			return;
		}

		course_cache[course_id].playback_data = obj;

		if(obj.length > 0) {
			total0_ms = obj[obj.length - 1].ts;
		}
		
		jf.readFile(file1, function(err, obj) { // read file1
			if(err) {
				return;
			}

			course_cache[course_id].playback_data1 = obj;

			if(obj.length > 0) {
				total1_ms = obj[obj.length - 1].ts;
			}

			course_cache[course_id].total_ms = total0_ms > total1_ms ? total0_ms : total1_ms;
			course_cache[course_id].total_ms = total2_ms > course_cache[course_id].total_ms ? total2_ms : course_cache[course_id].total_ms;

			user_obj.playback_data = course_cache[course_id].playback_data;
			user_obj.playback_data1 = course_cache[course_id].playback_data1;				
			user_obj.total_ms = course_cache[course_id].total_ms;
			user_obj.is_playback = true;
			user_obj.is_pause = false;
			
			console.log('all total:', total0_ms, total1_ms, total2_ms, user_obj.total_ms);
		});
	});

}

playback.control_stop_playback = function(data, socket) {

	console.log('stop_playback', data);
	var user_obj = socket.user_obj;
	
	if(user_obj === undefined) {
		return;
	}

	user_obj.is_playback = false;	
	user_obj.is_pause = false;	
	user_obj.playback_index = 0;
	user_obj.playback_index1 = 0;
	user_obj.curr_ms = 0;		

}

playback.control_pause_resume_playback = function(data, socket) {

	console.log('pause_resume_playback', data);
	var is_pause = data.is_pause;
	var user_obj = socket.user_obj;

	if(user_obj === undefined) {
		return;
	}

	user_obj.is_pause = is_pause;		

}

playback.control_seek_playback = function(data, socket) {

	console.log('seek_playback', data);
	var user_obj = socket.user_obj;

	if(user_obj === undefined || !user_obj.is_playback) {
		return;	
	}

	user_obj.is_playback = false;
	
	var seek_pos = parseInt(data.pos);
	//console.log('seek_pos', seek_pos);
	var old_ppt_index = 0;
	var old_whiteboard_index = 0;
	var whiteboard_ts = 0;
	var old_chat_index = 0;
	var chat_ts = 0;

    for(var i=0; i < user_obj.playback_data.length; i++){
		var ts = user_obj.playback_data[i].ts;
		var type = user_obj.playback_data[i].type;

		if(type === 'prev' || type === 'next') {
			old_ppt_index = i;
		}

		if(ts >= seek_pos){
			old_whiteboard_index = i;
			whiteboard_ts = user_obj.playback_data[i].ts; 				
			break;
		}
	}

    for(var i=0; i < user_obj.playback_data1.length; i++){
		var ts = user_obj.playback_data1[i].ts;

		if(ts >= seek_pos){
			old_chat_index = i;
			chat_ts = user_obj.playback_data1[i].ts;
			break;
		}
	}

   	//user_obj.curr_ms = whiteboard_ts > chat_ts ? whiteboard_ts : chat_ts;
	user_obj.curr_ms = seek_pos;
	user_obj.playback_index = old_ppt_index;
	user_obj.playback_index1 = old_chat_index;
	user_obj.is_playback = true;

}