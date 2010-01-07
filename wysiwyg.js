// http://xpoint.ru/know-how/WYSIWYG/TrueJavaScriptEditor
// http://www.mozilla.org/editor/midasdemo/
(function ($) {

	function Wysiwyg(textarea) {
		this.textarea = textarea;
	}

	Wysiwyg.prototype.switch_to_design_mode = function () {
		var iframe;
		if (this.iframe) {
			iframe = this.iframe;
		} else {
			iframe = document.createElement('iframe');
			this.iframe = iframe;
			iframe.style.display = 'none';
			$(iframe).css('width', $(this.textarea).css('width'));
			$(iframe).css('height', $(this.textarea).css('height'));
			iframe.src = '#';
			document.body.appendChild(iframe);
		}
		iframe.style.display = '';
		this.textarea.style.display = 'none';
		try {
			iframe.contentWindow.document.execCommand("useCSS", false, true);
		} catch (e) {}
		export_textarea(this.textarea, iframe);
	};
	
	function export_textarea(textarea, iframe) {
		try {
			iframe.contentWindow.document.body.innerHTML = textarea.value;
			iframe.contentWindow.document.designMode = 'on';
			iframe.focus();
		} catch (e) {
			setTimeout(function () {
				export_textarea(textarea, iframe);
			}, 0);
		}
	}

	$.fn.wysiwyg = function () {
		return this.each(function () {
			wysiwyg = new Wysiwyg(this);
			setTimeout(function () {
				wysiwyg.switch_to_design_mode();
			}, 500);
		});
	};
})(jQuery);
