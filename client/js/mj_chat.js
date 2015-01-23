// /////////////////////////////////////////////////////////////////////////////
// chat part
// 
document
		.getElementById('messageInput')
		.addEventListener(
				'keyup',
				function(e) {
					var messageInput = document.getElementById('messageInput'), msg = messageInput.value, color = '#000000';
					if (e.keyCode == 13 && msg.trim().length != 0) {
						messageInput.value = '';
						socket.emit('new message', msg);
						_displayNewMsg(global_info.userid, msg);
					}
					;
				}, false);

document.getElementById('clearBtn').addEventListener('click', function() {
	document.getElementById('historyMsg').innerHTML = '';
}, false);

document.getElementById('emoji').addEventListener('click', function(e) {
	var emojiwrapper = document.getElementById('emojiWrapper');
	if (emojiwrapper.style.display === 'block') {
		emojiwrapper.style.display = 'none';
	} else {
		emojiwrapper.style.display = 'block';
	}
	e.stopPropagation();
}, false);

document.body.addEventListener('click', function(e) {
	var emojiwrapper = document.getElementById('emojiWrapper');
	if (e.target != emojiwrapper) {
		emojiwrapper.style.display = 'none';
	}
});

document.getElementById('emojiWrapper').addEventListener(
		'click',
		function(e) {
			var target = e.target;
			if (target.nodeName.toLowerCase() == 'img') {
				var messageInput = document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value = messageInput.value + '[emoji:'
						+ target.title + ']';
			}
		}, false);

function _initialEmoji() {
	var emojiContainer = document.getElementById('emojiWrapper'), docFragment = document
			.createDocumentFragment();
	for (var i = 69; i > 0; i--) {
		var emojiItem = document.createElement('img');
		emojiItem.src = './img/emoji/' + i + '.gif';
		emojiItem.title = i;
		docFragment.appendChild(emojiItem);
	}
	emojiContainer.appendChild(docFragment);
}

function _displayNewMsg(user, msg, color) {
	var container = document.getElementById('historyMsg'), msgToDisplay = document
			.createElement('p'), msg = _showEmoji(msg);
	msgToDisplay.style.color = color || '#000';
	msgToDisplay.innerHTML = user + ' : ' + msg;
	container.appendChild(msgToDisplay);
	container.scrollTop = container.scrollHeight;
}

function _showEmoji(msg) {
	var match, result = msg, reg = /\[emoji:\d+\]/g, emojiIndex, totalEmojiNum = document
			.getElementById('emojiWrapper').children.length;
	while (match = reg.exec(msg)) {
		emojiIndex = match[0].slice(7, -1);
		if (emojiIndex > totalEmojiNum) {
			result = result.replace(match[0], '[X]');
		} else {
			result = result.replace(match[0],
					'<img class="emoji" src="./img/emoji/' + emojiIndex
							+ '.gif" />');
		}
	}
	return result;
}

_initialEmoji();
