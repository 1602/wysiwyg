/*global jQuery*/
// http://xpoint.ru/know-how/WYSIWYG/TrueJavaScriptEditor
// http://www.mozilla.org/editor/midasdemo/
(function ($) {

	var undef;

	function Wysiwyg(textarea) {
		this.textarea = textarea;
	}

	Wysiwyg.prototype = {
		create_rich_editor: function () {
			var div = document.createElement('div');
			div.style.borderColor = '#000000';
			div.style.borderWidth = '1px';
			div.style.borderStyle = 'solid';
			div.style.width = this.textarea.offsetWidth + 'px';
			div.style.height = this.textarea.offsetHeight + 'px';
			this.textarea.parentNode.insertBefore(div, this.textarea.nextSibling);

			var control_panel = document.createElement('div');
			control_panel.style.width = this.textarea.offsetWidth + 'px';
			control_panel.style.height = '20px';
			control_panel.style.backgrounColor = '#eeeeee';
			div.appendChild(control_panel);

			var iframe = document.createElement('iframe');
			iframe.setAttribute('frameborder', 0);
			iframe.src = '#';
			iframe.style.width = this.textarea.offsetWidth + 'px';
			iframe.style.height = this.textarea.offsetHeight - 30 + 'px';
			div.appendChild(iframe);

			var resizer = document.createElement('div');
			resizer.style.width = this.textarea.offsetWidth + 'px';
			resizer.style.height = '20px';
			resizer.style.backgrounColor = '#eeeeee';
			resizer.style.cursor = 's-resize';
			div.appendChild(resizer);

			this.iframe = iframe;
			this.editor_block = div;
		},
		get_iframe: function () {
			if (this.iframe === undef) {
				this.create_rich_editor();
			}
			return this.iframe;
		},
		export_textarea: function () {
			var w = this;
			try {
				console.log(w.iframe, w.iframe.contentWindow, w.iframe.contentWindow.document, w.iframe.contentWindow.document.body);
				w.iframe.contentWindow.document.body.innerHTML = w.textarea.value;
				w.iframe.contentWindow.document.designMode = 'on';
				w.iframe.focus();
			} catch (e) {
				setTimeout(function () {
					w.export_textarea();
				}, 0);
			}
		},
		switch_to_design_mode: function () {
			var iframe = this.get_iframe();
			iframe.style.display = '';
			this.textarea.style.display = 'none';
			try {
				iframe.contentWindow.document.execCommand("useCSS", false, true);
			} catch (e) {

			}
			this.export_textarea();
		}
	};

	$.fn.wysiwyg = function () {
		return this.each(function () {
			wysiwyg = new Wysiwyg(this);
			setTimeout(function () {
				wysiwyg.switch_to_design_mode();
			}, 500);
		});
	};
})(jQuery);
