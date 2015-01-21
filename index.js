// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var jf = require('jsonfile');
var util = require('util');
var fs = require("fs");
var path = require("path");


function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something blew up!' });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var publishers = {};
var numPublisher = 0;

// live_rooms[course_id].publish
// live_rooms[course_id].users
var live_rooms = {};
var interval_ms = 40;
var interval_handler = null;

// course -> file
// file_db[course_id].file
// file_db[course_id].file1
// file_db[course_id].file2
var file_db = {};

// course -> memory
// course_cache[course_id].total_ms
// course_cache[course_id].playback_data
// course_cache[course_id].playback_data1
var course_cache = {};

// user_obj
// user_obj.username
// user_obj.course_id
// user_obj.socket
// user_obj.curr_ms
// user_obj.is_playback
// user_obj.is_pause
// user_obj.playback_index
// user_obj.playback_index1
// user_obj.playback_data
// user_obj.playback_data1
// user_obj.total_ms

// publish_obj.username
// publish_obj.course_id
// publish_obj.socket
// publish_obj.record_data
// publish_obj.record_data1
// publish_obj.is_record
// publish_obj.base_timestamp
// piblish_obj.ffmpeg_process

// socket
// socket.username
// socket.course_id
// socket.role
// socket.user_obj || socket.publish_obj

var prev_path = '/home/pony/jiaoxue/jiaoxue-web-app/public/jiaoxue/data/';

/////////////////////////////////////////////////////////////////////////////
//
// server
//
function start_playback_server() {
	var interval_function = function() {
		for(var key in usernames) {
			var user_obj = usernames[key];

			if(user_obj.is_playback && !user_obj.is_pause) {
				user_obj.curr_ms += interval_ms;

				for(; user_obj.playback_index < user_obj.playback_data.length; user_obj.playback_index++) {
					var data_ = user_obj.playback_data[user_obj.playback_index];
			
					//console.log(data_.ts, user_obj.curr_ms);
					if(data_.ts <= user_obj.curr_ms) {
						user_obj.socket.emit(data_.type, data_.data);
					} else {
						break;
					}
				}

				for(; user_obj.playback_index1 < user_obj.playback_data1.length; user_obj.playback_index1++) {
					var data1_ = user_obj.playback_data1[user_obj.playback_index1];

					if(data1_.ts <= user_obj.curr_ms) {
						user_obj.socket.emit('new message', data1_.data );
					} else {					
						break;
					}
				}
		
				if(user_obj.curr_ms >= user_obj.total_ms) {				
					user_obj.is_playback = false;
					user_obj.playback_index = 0;
					user_obj.playback_index1 = 0;
					user_obj.curr_ms = 0;
				}
		
			} // if
		} // for
	};

	if(interval_handler == null) {
		interval_handler = setInterval(interval_function, interval_ms);
	}
}

function stop_playback_server() {
	if(interval_handler != null) {
		clearInterval(interval_handler);
		interval_handler = null;
	}
}

start_playback_server();

function mkdirsSync(dirname, mode){
    console.log(dirname);
    if(fs.existsSync(dirname)){
        return true;
    }else{
        if(mkdirsSync(path.dirname(dirname), mode)){
            fs.mkdirSync(dirname, mode);
            return true;
        }
    }
}

io.on('connection', function (socket) {
	/////////////////////////////////////////////////////////////////////////////
	//
	// playback
	//
	/**
	 * start_playback
	 */
	socket.on('start_playback', function(data) {
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
		var path = prev_path + course_id ;
		file_db[course_id].file = path + '/' +course_id + '_0.json';
		file_db[course_id].file1 = path + '/' +course_id + '_1.json';
		file_db[course_id].file2 = path + '/' +course_id + '_2.mp4';

		// if no cache
		course_cache[course_id] = {};
		var total0_ms = 0;
		var total1_ms = 0;
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

				user_obj.playback_data = course_cache[course_id].playback_data;
				user_obj.playback_data1 = course_cache[course_id].playback_data1;				
				user_obj.total_ms = course_cache[course_id].total_ms;
				user_obj.is_playback = true;
				user_obj.is_pause = false;
			});
		});
	});

	/**
	 * stop_playback
	 */
	socket.on('stop_playback', function(data) {
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
	});

	/**
	 * pause_resume_playback
	 */
	socket.on('pause_resume_playback', function(data) {
		console.log('pause_resume_playback', data);
		var is_pause = data.is_pause;
		var user_obj = socket.user_obj;

		if(user_obj === undefined) {
			return;
		}

		user_obj.is_pause = is_pause;		
	});
	
	/**
	 * seek_playback
	 */
	socket.on('seek_playback', function(data) {
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
	});

	/////////////////////////////////////////////////////////////////////////////
	//
	// play live
	//
	socket.on('start_playlive',function(data){
	    console.log('start_playlive', data);
	    socket.is_live = true;
	    if (data.course_id === 'undefined') {
	        socket.disconnect();
	        return;
	    }

	    var user_obj;
	    if (socket.role === 'student') {
	         user_obj = socket.user_obj;
	    } else if (socket.role === 'teacher') {
	         user_obj = socket.publish_obj;
	    }

	    if (user_obj === undefined) {
	        return;
	    }

	    adduser_change_num(data,socket, user_obj);
	});

	function adduser_change_num(data,socket, user_obj) {
	    user_obj.course_id = data.course_id;
	    socket.course_id = user_obj.course_id;
	    socket.join(user_obj.course_id);
	    if (live_rooms[user_obj.course_id] === undefined) {
	        live_rooms[user_obj.course_id] = { users: 1 };
	    } else {
	        console.log(user_obj.course_id, live_rooms[user_obj.course_id]);
	        live_rooms[user_obj.course_id].users++;
	    }        
	    data.numUsers = live_rooms[user_obj.course_id].users;
	    emit_user_num_change_info(socket, 'user number change', data)
	    console.log('adduser_change_num', 'user number change', data);
	}

	function leaveuser_change_num(socket, user_obj, data) {
	    console.log('leaveuser_change_num', live_rooms[user_obj.course_id], user_obj.course_id);
	    live_rooms[user_obj.course_id].users--;
        
	    data.numUsers = live_rooms[user_obj.course_id].users;
	    emit_user_num_change_info(socket, 'user number change', data);
	    console.log('leaveuser_change_num', 'user number change', data);

	    socket.leave(user_obj.course_id);
	    user_obj.course_id = 0;
	    socket.course_id = user_obj.course_id;
	}

	

	function emit_user_num_change_info(socket, type, data) {        
	    //send_and_record_data(socket, type, data, true);
	    send_data(socket, type, data, true);
	    record_other_data(data);
	}

	socket.on('stop_playlive', function (data) {
	    leave_room(socket, data);
	});

	function leave_room(socket, data) {
	    var user_obj;
	    if (socket.role === 'student') {
	        user_obj = socket.user_obj;
	    } else if (socket.role === 'teacher') {
	        user_obj = socket.publish_obj;
	    }

	    if (user_obj === undefined) {
	        return;
	    }

	    leaveuser_change_num(socket, user_obj,data);
	}
	
	/////////////////////////////////////////////////////////////////////////////
	//
	// record
	//
	socket.on('start_record', function(data) {
		console.log('start_record', data);
		
		var course_id = data.course_id;
		var publish_obj = socket.publish_obj;
		
		file_db[course_id] = {};
		var path = prev_path + course_id;

		mkdirsSync(path, null);

		file_db[course_id].file = path + '/' +course_id + '_0.json';
		file_db[course_id].file1 = path + '/' +course_id + '_1.json';
		file_db[course_id].file2 = path + '/' +course_id + '_2.mp4';
		console.log('file', file_db[course_id].file);
		console.log('file1', file_db[course_id].file1);

		if(publish_obj === undefined){
			return;		
		}
         
		publish_obj.is_record = true;
		publish_obj.course_id = course_id;
		publish_obj.record_data = [];
		publish_obj.record_data1 = [];
		publish_obj.file = file_db[course_id].file;
		publish_obj.file1 = file_db[course_id].file1;
		publish_obj.file2 = file_db[course_id].file2;
		publish_obj.base_timestamp = new Date().getTime();

		//socket.join(course_id);
		socket.course_id = course_id;

		console.log(publish_obj);

		if(publish_obj.ffmpeg_process === undefined){
			console.log('ffmpeg_process');

			var spawn = require('child_process').spawn;
			var live_addr = 'rtmp://192.168.10.250:1935/live' + '/' + course_id;
			publish_obj.ffmpeg_process = spawn('/home/pony/simple-rtmp-server-master/trunk/objs/ffmpeg/bin/ffmpeg', 
					['-i', live_addr, '-vn', '-c:a', 'libaacplus', '-b:a', '40000', '-ar', '44100', '-ac', '2', '-f', 'mp4', '-y', publish_obj.file2]);

			publish_obj.ffmpeg_process.stdout.on('data', function (data) {
				//console.log('stdout: ' + data);
			});

			publish_obj.ffmpeg_process.stderr.on('data', function (data) {
				//console.log('stderr: ' + data);
			});

			publish_obj.ffmpeg_process.on('close', function (code) {
				console.log('child process exited with code ' + code);
			});
		}
	});

	socket.on('stop_record', function(data) {
		console.log('stop_record', data);
		var publish_obj = socket.publish_obj;

		if(publish_obj === undefined){
			return;		
		}

		if(publish_obj.is_record == true){
			jf.writeFile(publish_obj.file, publish_obj.record_data, function(err) {
				console.log(err);
			});

			jf.writeFile(publish_obj.file1, publish_obj.record_data1, function(err) {
				console.log(err);
			});
		
			publish_obj.ffmpeg_process.kill('SIGTERM');
			delete publish_obj.ffmpeg_process;
		}

		publish_obj.is_record = false;
		//socket.leave(publish_obj.course_id);
		socket.course_id = 0;

		if(course_cache[publish_obj.course_id] !== undefined) {
			delete course_cache[publish_obj.course_id];
		}
	});


	/////////////////////////////////////////////////////////////////////////////
	//
	// white board
	//

	function record_data(type, obj, data) {
		var data_ = {};
		data_.type = type;
		var curr_timestamp = new Date().getTime();
		var curr_offset = curr_timestamp - obj.base_timestamp;		
		data_.ts = curr_offset;
		data_.data = data;		
		obj.record_data.push(data_);
	}


	function send_and_record_data(socket, type, data, toself) {
	    if (socket.course_id == 0) {
	        //socket.broadcast.emit(type, data);
	    } else {
	        if (toself) {
	            socket.emit(type, data);
	        }
	        socket.to(socket.course_id).emit(type, data);
	    }	    

	    var publish_obj = socket.publish_obj;

	    if (publish_obj === undefined) {
	        return;
	    }

	    if (publish_obj.is_record) {
	        console.log('send_and_record_data', type, data);
	        record_data(type, publish_obj, data);
	    }
	}

	socket.on('next', function(data) {
		send_and_record_data(socket,'next',data,false);
	});

	socket.on('prev', function(data) {
	    send_and_record_data(socket, 'prev', data, false);
	});

	socket.on('mousedown', function(data) { 
	    send_and_record_data(socket, 'mousedown', data, false);
	});

	socket.on('mouseup', function(data) {
	    send_and_record_data(socket, 'mouseup', data, false);
	});

	socket.on('mousemove', function(data) {
	    send_and_record_data(socket, 'mousemove', data, false);
	});

	socket.on('clear_screen', function(data) {
	    send_and_record_data(socket, 'clear_screen', data, false);

	});


	/////////////////////////////////////////////////////////////////////////////
	//
	// chat
	//
        
	function send_msg(socket,type,msg){
		if(socket.course_id == 0) {
			//socket.broadcast.emit(type, msg );
		} else {
			socket.to(socket.course_id).emit(type, msg );
		}
	}

	function send_data(socket, type, data, toself) {
	    if (socket.course_id == 0) {
	        //socket.broadcast.emit(type, data);
	    } else {
	        if (toself) {
	            socket.emit(type, data);
	        }
	        socket.to(socket.course_id).emit(type, data);
	    }
	}

	function record_other_data(data) {	    
	    
	    var user_obj = null;
	    if (socket.role === 'teacher') {
	        user_obj = socket.publish_obj;
	    } else {
	        user_obj = socket.user_obj;
	    }

	    var publish_key = 0;

	    if (user_obj !== undefined) {
	        publish_key = user_obj.course_id;
	    }

	    console.log('publish_key', publish_key);

	    var is_find_publish = false;
	    var publish_obj = null;

	    for (var username in publishers) {
	        publish_obj = publishers[username];
	        console.log('***********', username, publish_obj.course_id);

	        if (publish_obj.course_id == publish_key) {
	            is_find_publish = true;
	            break;
	        }
	    }

	    if (is_find_publish) {
	        console.log('publish_obj');

	        if (publish_obj.is_record) {
	            console.log('publish_obj.is_record=true');
	            var data_ = {};
	            data_.type = 'user number change';
	            var curr_timestamp = new Date().getTime();
	            var curr_offset = curr_timestamp - publish_obj.base_timestamp;
	            data_.ts = curr_offset;
	            data_.data = data;
	            publish_obj.record_data.push(data_);
	        }
	    }
	};

	// when the client emits 'new message', this listens and executes
	socket.on('new message', function (data) {
		
		var msg =  {
			  username: socket.username,
			  message: data
		};
		console.log('new message',msg);

		// we tell the client to execute 'new message'

		send_msg(socket,'new message',msg);

		console.log('new message', socket.username );
        
		var user_obj = null;
		if (socket.role === 'teacher') {
		    user_obj = socket.publish_obj;
		} else {
		    user_obj = socket.user_obj;
		}
            
		var publish_key = 0;

		if(user_obj !== undefined) {
			publish_key = user_obj.course_id;				
		}

		

		
		console.log('publish_key', publish_key);

		var is_find_publish = false;
		var publish_obj = null;

		for(var username in publishers) {
			publish_obj = publishers[username];	
			console.log('***********', username, publish_obj.course_id);					
			
			if(publish_obj.course_id == publish_key) {
				is_find_publish = true;
				break;
			}
		}
		
		if(is_find_publish) {
			console.log('publish_obj');

			if(publish_obj.is_record) {
				console.log('publish_obj.is_record=true');
				var data_ = {};
				data_.type = 'new message';
				var curr_timestamp = new Date().getTime();
				var curr_offset = curr_timestamp - publish_obj.base_timestamp;
				data_.ts = curr_offset;
				data_.data = msg;				
				publish_obj.record_data1.push(data_);
			}
		}
	});

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (data) {
	console.log('add user', data);

	var obj = {};
	obj.username = data.username;
	obj.socket = socket;
	obj.course_id = 0;
	obj.is_pause = false;
	obj.role = data.role;

	if(data.role === 'student') {
		// add the client's username to the global list
		usernames[data.username] = obj;
		socket.user_obj = obj;	

	} else if(data.role === 'teacher') { 
		publishers[data.username] = obj;
		socket.publish_obj = obj;	
	} else {
		return;
	}

	// we store the username in the socket session for this client
	socket.username = data.username;
	socket.role = data.role;
	socket.course_id = 0;
	//numUsers++;
	socket.emit('login', {
		numUsers: numUsers
	});

	// echo globally (all clients) that a person has connected
	/*var msg = {username: socket.username,numUsers:numUsers};
	send_msg(socket,'user joined',msg);*/

  });

  // when the client emits 'typing', we broadcast it to others
  /*socket.on('typing', function () {
	var msg = {username: socket.username};
	send_msg(socket,'typing',msg);
  });*/

  // when the client emits 'stop typing', we broadcast it to others
  /*socket.on('stop typing', function () {
	var msg = {username: socket.username}; 
	send_msg(socket,'stop typing',msg);
  });*/

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
	if(socket.role === 'teacher') {
		// remove the username from global publishers list
		var publish_obj = socket.publish_obj;
		if(publish_obj.is_record == true){
        	publish_obj.ffmpeg_process.kill('SIGTERM');
		}
		delete publishers[socket.username];
		//--numPublishers;
	} else if(socket.role === 'student') {
		// remove the username from global usernames list
		delete usernames[socket.username];
		//--numUsers;
	}

	// echo globally that this client has left
	/*var msg = {username: socket.username,numUsers:numUsers};
	send_msg(socket,'user left',msg);*/

	if (socket.is_live) {
	    var data = { course_id: socket.course_id };
	    leave_room(socket, data);
	}   
  });
});
