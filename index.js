// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;

var mj_playback = require('./server/mj_playback');
var mj_playlive = require('./server/mj_playlive');
var mj_record = require('./server/mj_record');
var mj_login = require('./server/mj_login');


var usernames = {};
var numUsers = 0;
var publishers = {};
var numPublisher = 0;



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


function socket_cb(socket) {

	/////////////////////////////////////////////////////////////////////////////
	// play back
	//
	
	socket.on('start_playback',
			function(data) {
				mj_playback.control_start_playback(data, socket, course_cache,
						file_db);
			});

	socket.on('stop_playback', function(data) {
		mj_playback.control_stop_playback(data, socket);
	});

	socket.on('pause_resume_playback', function(data) {
		mj_playback.control_pause_resume_playback(data, socket);
	});

	socket.on('seek_playback', function(data) {
		mj_playback.control_seek_playback(data, socket);
	});

	/////////////////////////////////////////////////////////////////////////////
	// play live
	//
	
	socket.on('start_playlive', function(data) {
		mj_playlive
				.control_start_playlive(data, socket, publishers);
	});

	socket.on('stop_playlive', function(data) {
		mj_playlive.leave_room(data, socket, publishers);
	});

	/////////////////////////////////////////////////////////////////////////////
	// record
	//
	socket.on('start_record', function(data) {
		mj_record.control_start_record(data, socket, file_db);
	});

	socket.on('stop_record', function(data) {
		mj_record.control_stop_record(data, socket, course_cache);
	});

	/////////////////////////////////////////////////////////////////////////////
	// white board
	//

	socket.on('next', function(data) {
		mj_record.send_and_record_data(socket, 'next', data, false);
	});

	socket.on('prev', function(data) {
		mj_record.send_and_record_data(socket, 'prev', data, false);
	});

	socket.on('mousedown', function(data) {
		mj_record.send_and_record_data(socket, 'mousedown', data, false);
	});

	socket.on('mouseup', function(data) {
		mj_record.send_and_record_data(socket, 'mouseup', data, false);
	});

	socket.on('mousemove', function(data) {
		mj_record.send_and_record_data(socket, 'mousemove', data, false);
	});

	socket.on('clear_screen', function(data) {
		mj_record.send_and_record_data(socket, 'clear_screen', data, false);

	});

	/////////////////////////////////////////////////////////////////////////////
	// chat
	//

	socket.on('new message', function(data) {
		mj_record.send_and_record_chat_data(data, socket, publishers);
	});

	socket.on('add user', function(data) {
		mj_login.add_user(data,socket,usernames,publishers,numUsers);
	});

	socket.on('disconnect', function() {
		
		mj_login.disconnect(data,socket,publishers,usernames);
		
		if (socket.is_live) {
			var data = {
				course_id : socket.course_id
			};
			mj_playlive.leave_room(data, socket, publishers);
		}
	});
	
}


function logErrors(err, req, res, next) {
	console.error(err.stack);
	next(err);
}

function clientErrorHandler(err, req, res, next) {
	if (req.xhr) {
		res.status(500).send({
			error : 'Something blew up!'
		});
	} else {
		next(err);
	}
}

function errorHandler(err, req, res, next) {
	res.status(500);
	res.render('error', {
		error : err
	});
}

app.use(express.static(__dirname + '/client'));
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

///////////////////////////////////////////////////
// main
//

mj_playback.start_playback_server(usernames);

io.on('connection', function(socket) {
	socket_cb(socket);
});

server.listen(port, function() {
	console.log('Server listening at port %d', port);
});