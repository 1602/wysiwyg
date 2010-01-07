/*global jQuery*/
// http://xpoint.ru/know-how/WYSIWYG/TrueJavaScriptEditor
// http://www.mozilla.org/editor/midasdemo/
// http://www.quirksmode.org/dom/execCommand.html
// 15-17 x 21-24
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
			control_panel.style.height = '22px';
			control_panel.style.background = 'ThreeDFace';
			div.appendChild(control_panel);

			var iframe = document.createElement('iframe');
			iframe.setAttribute('frameborder', 0);
			iframe.src = '#';
			iframe.style.display = 'none';
			iframe.style.width = this.textarea.offsetWidth + 'px';
			iframe.style.height = this.textarea.offsetHeight - 32 + 'px';
			div.appendChild(iframe);

			var style = document.createElement('link');
			style.rel = 'stylesheet';
			style.type = 'text/css';
			style.href = 'common.css';
			iframe.contentWindow.document.getElementsByTagName('head')[0].appendChild(style);


			var resizer = document.createElement('div');
			resizer.style.width = this.textarea.offsetWidth + 'px';
			resizer.style.height = '6px';
			resizer.style.backgroundColor = '#eeeeee';
			resizer.style.cursor = 's-resize';
			div.appendChild(resizer);

			this.iframe = iframe;
			this.editor_block = div;
			this.control_panel = control_panel;
			this.resizer = resizer;
			this.init_controls();
		},
		init_controls: function () {
			var editor = this.iframe.contentWindow.document;
			var commands = [
				{
					image: 'text_bold',
					action: 'bold'
				},
				{
					image: 'text_italic',
					action: 'italic'
				},
				{
					image: 'text_underline',
					action: 'underline'
				},
				{
					image: 'text_align_left',
					action: 'justifyleft'
				},
				{
					image: 'text_align_center',
					action: 'justifycenter'
				},
				{
					image: 'text_align_right',
					action: 'justifyright'
				},
				{
					image: 'text_align_justify',
					action: 'justifyfull'
				},
				{
					image: 'arrow_undo',
					action: 'undo'
				},
				{
					image: 'arrow_redo',
					action: 'redo'
				}
			];
			for (var i = 0, len = commands.length; i < len; i++) {
				var button = document.createElement('div');
				var cmd = commands[i];
				//button.style.border = '1px solid';
				button.style.width = '16px';
				button.style.height = '16px';
				button.style.margin = '2px';
				button.style.display = 'inline-block';
				button.style.textAlign = 'center';
				button.style.cursor = 'default';
				button.style.background = 'ThreeDFace url(images/' + cmd.image + '.png)';
				button.onmouseover = (function (b) {
					return function () {
						//b.style.backgroundColor = 'ThreeDHighlight';
					};
				})(button);
				button.onmouseout = (function (b) {
					return function () {
						//b.style.backgroundColor = 'ThreeDFace';
						b.style.backgroundPosition = '0 0';
					};
				})(button);
				button.onmousedown = (function (b) {
					return function () {
						//b.style.backgroundColor = '#eee';
						b.style.backgroundPosition = '1px 1px';
						return false;
					};
				})(button);
				button.onmouseup = (function(cmd, b) {
					return function () {
						editor.execCommand(cmd.action, null, '');
						//b.style.backgroundColor = 'ThreeDFace';
						b.style.backgroundPosition = '0 0';
						return false;
					};
				})(cmd, button);
				this.control_panel.appendChild(button);
			}
			
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
