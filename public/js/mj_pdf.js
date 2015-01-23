// /////////////////////////////////////////////////////////////////////////////
// pdf part
//
var pdf_url = global_info.pdf_addr;
var pdfDoc = null, pageNum = 1, pageRendering = false, pageNumPending = null, scale = 2, canvas = document
		.getElementById('the-canvas'), ctx = canvas.getContext('2d');


function renderPage(num) {
	pageRendering = true;

	pdfDoc.getPage(num).then(function(page) {
		var viewport = page.getViewport(scale);
		pdf_w = viewport.width;
		pdf_h = viewport.height;
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		var renderContext = {
			canvasContext : ctx,
			viewport : viewport
		};
		var renderTask = page.render(renderContext);

		renderTask.promise.then(function() {
			pageRendering = false;
			if (pageNumPending !== null) {
				renderPage(pageNumPending);
				pageNumPending = null;
			}
			ctx.strokeStyle = "red";
			ctx.lineWidth = 3;

		});
	});

	document.getElementById('page_num').textContent = num;
}

function queueRenderPage(num) {
	if (pageRendering) {
		pageNumPending = num;
	} else {
		renderPage(num);
	}
}

function onPrevPage() {
	if (pageNum <= 1) {
		return;
	}
	pageNum--;
	queueRenderPage(pageNum);
	if (global_info.role === 'teacher') {
		socket.emit('prev', {
			pageNum : pageNum
		});
	}
}

function onNextPage() {
	if (pageNum >= pdfDoc.numPages) {
		return;
	}
	pageNum++;
	queueRenderPage(pageNum);
	if (global_info.role === 'teacher') {
		socket.emit('next', {
			pageNum : pageNum
		});
	}
}

/**
 * Asynchronously downloads PDF.
 */
PDFJS.getDocument(pdf_url).then(function(pdfDoc_) {
	pdfDoc = pdfDoc_;
	document.getElementById('page_count').textContent = pdfDoc.numPages;
	renderPage(pageNum);

	document.getElementById('prev').addEventListener('click', onPrevPage);
	document.getElementById('next').addEventListener('click', onNextPage);
});