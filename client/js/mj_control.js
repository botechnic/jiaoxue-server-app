///////////////////////////////////////////////////////////////////////////////
// login part
// 
var username;
var connected = false;
var pp = false;

var socket = io.connect(global_info.socketio_addr);

function set_user_name() {
	if (username) {
		if (global_info.role === 'teacher') {
			socket.emit('add user', {
				role : 'teacher',
				username : username
			});
		} else {
			socket.emit('add user', {
				role : 'student',
				username : username
			});
		}
	}
}

function add_user() {
	var username_ = global_info.userid;
	username = username_;
	set_user_name();
}

socket.on('connect', function() {
	console.log('connected');

	add_user();

	if (global_info.biz_type === 'live' || global_info.biz_type === 'record') {
		mj_live.start_playlive();
	}
});

socket.on('login', function(data) {
	connected = true;
});

socket.on('user number change', function(data) {
	var numUsers = data.numUsers;
	console.log('user number change', data);
	document.getElementById('number_users').textContent = numUsers;
});

socket.on('new message', function(data) {
	console.log('new message');
	_displayNewMsg(data.username, data.message);
});

socket.on('prev', function(e) {
	console.log('prev', e.pageNum);
	var pageNum = e.pageNum;
	queueRenderPage(pageNum);
});

socket.on('next', function(e) {
	console.log('next', e.pageNum);
	var pageNum = e.pageNum;
	queueRenderPage(pageNum);
});

socket.on('mousedown', function(e) {
	console.log('mousedown');
	pp = true;
	var mouseX = e.mouseX;
	var mouseY = e.mouseY;
	ctx.moveTo(mouseX, mouseY);
});

socket.on('mouseup', function(e) {
	console.log('mouseup');
	pp = e.pp;
});

socket.on('mousemove', function(e) {
	console.log('mousemove');
	var mouseX = e.mouseX;
	var mouseY = e.mouseY;
	pp = e.pp;
	if (pp) {
		ctx.lineTo(mouseX, mouseY);
		ctx.stroke();
	}
});


