var jf = require('jsonfile');
var fs = require('fs');
var path = require('path');
var config = require('./config');

var record = module.exports;

record.control_start_record = function(data,socket,file_db){

	console.log('start_record', data);
	
	var course_id = data.course_id;
	var publish_obj = socket.publish_obj;
	
	file_db[course_id] = {};
	var path = config.prev_path + course_id;

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

	//console.log(publish_obj);

	if(publish_obj.ffmpeg_process === undefined){
		console.log('ffmpeg_process');

		var spawn = require('child_process').spawn;
		var live_addr = config.live_addr + '/' + course_id;
		publish_obj.ffmpeg_process = spawn(config.ffmpeg_path, 
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

}


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

record.control_stop_record = function(data,socket,course_cache){

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

}

record.send_and_record_data = function(socket, type,data, toself){

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

function record_data(type, obj, data) {
	var data_ = {};
	data_.type = type;
	var curr_timestamp = new Date().getTime();
	var curr_offset = curr_timestamp - obj.base_timestamp;		
	data_.ts = curr_offset;
	data_.data = data;		
	obj.record_data.push(data_);
}


record.send_and_record_chat_data = function(data,socket,publishers){

	
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

}

function send_msg(socket,type,msg){
	if(socket.course_id == 0) {
		//socket.broadcast.emit(type, msg );
	} else {
		socket.to(socket.course_id).emit(type, msg );
	}
}

