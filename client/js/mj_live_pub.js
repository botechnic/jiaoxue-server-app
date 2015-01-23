var user_access_mic = false;

function init_live_pub() {
	var flashvars = {
			streamer : global_info.publish_addr,
			file : "" + global_info.course_id,
			onStopRecord : 'stopRecord',
			onError : 'testerror',
			publishType : 'live',
			labelRecord : 'start',
			labelStop : 'stop'
		};
		var params = {
			menu : "false",
			scale : "noScale",
			allowFullscreen : "true",
			allowScriptAccess : "always",
			bgcolor : "black",
			wmode : "direct" // can cause issues with FP settings & webcam
		};
		var attributes = {
			id : "RtmpLiveEncoder"
		};
		swfobject.embedSWF("./asset/RtmpLiveEncoder.swf", "altContent", "215",
				"138", "11.0.0", "./asset/expressInstall.swf", flashvars, params,
				attributes);

}

function testerror(ok) {
	console.log('err', ok);
	// return "kolya";

	if (ok === 'user_denied_mic' || ok === 'user_access_mic') {
		user_access_mic = true;
		var live_publish = document.getElementById('live_publish');
		live_publish.style.position = 'inherit';
		live_publish.style.width = '1px';
		live_publish.style.height = '1px';
		live_publish.style.top = '0px';
		live_publish.style.left = '0px';

		var rtmpLiveEncoder = document.getElementById('RtmpLiveEncoder');
		rtmpLiveEncoder.style.width = '1px';
		rtmpLiveEncoder.style.height = '1px';
	}

	if (ok === 'user_denied_mic') {
		// alert('please open your mic!');
		alert('请打开MIC！');
	}

	//onresize();
}

function testecho() {
	var flash = document.getElementById('RtmpLiveEncoder');
	flash.test_echo("testecho");
}