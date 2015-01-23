var login = module.exports;

login.add_user = function(data,socket,usernames,publishers,numUsers){

	console.log('add user', data);

	var obj = {};
	obj.username = data.username;
	obj.socket = socket;
	obj.course_id = 0;
	obj.is_pause = false;
	obj.role = data.role;

	if (data.role === 'student') {
		usernames[data.username] = obj;
		socket.user_obj = obj;

	} else if (data.role === 'teacher') {
		publishers[data.username] = obj;
		socket.publish_obj = obj;
	} else {
		return;
	}

	socket.username = data.username;
	socket.role = data.role;
	socket.course_id = 0;
	socket.emit('login', {
		numUsers : numUsers
	});

}

login.disconnect = function(data,socket,publishers,usernames){

	if (socket.role === 'teacher') {
		var publish_obj = socket.publish_obj;
		if (publish_obj.is_record == true) {
			publish_obj.ffmpeg_process.kill('SIGTERM');
		}
		delete publishers[socket.username];
	} else if (socket.role === 'student') {
		delete usernames[socket.username];
	}

}