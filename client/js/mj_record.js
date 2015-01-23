// /////////////////////////////////////////////////////////////////////////////
// record part
// 

var is_record = false;

function start_record() {
	pageNum = 1;
	// renderPage(pageNum);
	console.log('start_record');
	// var course_id = parseInt(document.getElementById('course_id').value);
	var course_id = global_info.course_id;
	socket.emit('start_record', {
		record : true,
		course_id : course_id
	});
	socket.emit('next', {
		pageNum : pageNum
	});
}

function stop_record() {
	console.log('stop_record');

	if (socket) {
		socket.emit('stop_record', {
			record : false
		});
	}
}

function start_stop_record() {
	var start_stop_record = document.getElementById('start_stop_record');

	if (!is_record) {
		start_stop_record.src = 'img/stop_record.png';
		is_record = true;
		pageNum = 1;
		console.log('start_record');
		var course_id = global_info.course_id;
		socket.emit('start_record', {
			record : true,
			course_id : course_id
		});
		socket.emit('next', {
			pageNum : pageNum
		});
	} else {
		start_stop_record.src = 'img/start_record.png';
		is_record = false;
		console.log('stop_record');
		if (socket) {
			socket.emit('stop_record', {
				record : false
			});
		}
	}
}

document.getElementById('start_stop_record').addEventListener('click',
		start_stop_record);

var pp = false;

var interval_handler = null;
var mousemove_capture_flag = true;
var interval_function1 = function() {
	mousemove_capture_flag = true;
};

if (global_info.role === 'teacher') {
	canvas.addEventListener('mousedown', function(e) {
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		mouseX = mouseX * mouse_factor;
		mouseY = mouseY * mouse_factor;

		pp = true;
		ctx.moveTo(mouseX, mouseY);
		socket.emit('mousedown', {
			mouseX : mouseX,
			mouseY : mouseY
		});

		e.preventDefault();
		// start interval
		interval_handler = setInterval(interval_function1, 40);

	});

	canvas.addEventListener('mouseup', function(e) {
		pp = false;
		socket.emit('mouseup', {
			pp : false
		});

		clearInterval(interval_handler);
		interval_handler = null;
	});

	canvas.addEventListener('mousemove', function(e) {
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		mouseX = mouseX * mouse_factor;
		mouseY = mouseY * mouse_factor;
		if (pp == true && mousemove_capture_flag == true) {
			ctx.lineTo(mouseX, mouseY);
			socket.emit('mousemove', {
				mouseX : mouseX,
				mouseY : mouseY,
				pp : pp
			});
			ctx.stroke();

			mousemove_capture_flag = false;
		}
	});

}