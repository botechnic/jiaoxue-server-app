/**
 * Created by user on 2015/1/23.
 */
// live_rooms[course_id].publish
// live_rooms[course_id].users
var live_rooms = {};
var playlive = module.exports;

function adduser_change_num (data,socket,user_obj,publishers){
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
    emit_user_num_change_info(socket, 'user number change', data,publishers)
    console.log('adduser_change_num', 'user number change', data);
}


function leaveuser_change_num(data,socket,user_obj,publishers){
    console.log('leaveuser_change_num', live_rooms[user_obj.course_id], user_obj.course_id);
    live_rooms[user_obj.course_id].users--;

    data.numUsers = live_rooms[user_obj.course_id].users;
    emit_user_num_change_info(socket, 'user number change', data,publishers);
    console.log('leaveuser_change_num', 'user number change', data);

    socket.leave(user_obj.course_id);
    user_obj.course_id = 0;
    socket.course_id = user_obj.course_id;
}


function emit_user_num_change_info(socket, type, data,publishers) {
    //send_and_record_data(socket, type, data, true);
    send_data(socket, type, data, true);
    record_other_data(data,socket,publishers);
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

function record_other_data(data,socket,publishers) {

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


playlive.control_start_playlive = function(data,socket,publishers){
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

    adduser_change_num(data,socket,user_obj,publishers);
}

playlive.leave_room = function(data,socket,publishers){
    var user_obj;
    if (socket.role === 'student') {
        user_obj = socket.user_obj;
    } else if (socket.role === 'teacher') {
        user_obj = socket.publish_obj;
    }

    if (user_obj === undefined) {
        return;
    }
    leaveuser_change_num(data,socket,user_obj,publishers);
}