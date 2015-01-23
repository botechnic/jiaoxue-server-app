function my_padding(number, length, prefix) {
	if (String(number).length >= length) {
		return String(number);
	}
	return my_padding(prefix + number, length, prefix);
}

function get_time_str(time) {
	var time_str = "";
	// hour
	time = time % (24 * 3600);
	time_str += my_padding(parseInt(time / 3600), 2, '0') + ":";
	// minute
	time = time % (3600);
	time_str += my_padding(parseInt(time / 60), 2, '0') + ":";
	// seconds
	time = time % (60);
	time_str += my_padding(parseInt(time), 2, '0');
	return time_str;
}