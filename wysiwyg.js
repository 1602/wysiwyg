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

	var util = {
		set_style: function (element, style) {
			for (var i in style) {
				if (style.hasOwnProperty(i)) {
					element.style[i] = style[i];
				}
			}
		},
		add_event: function (element, event, callback) {
			if (this.is_array(element)) {
				for (var i = 0, len = element.length; i < len; i++ ) {
					this.add_event(element[i], event, callback);
				}
				return;
			}
			if (element.attachEvent) {
				element.attachEvent(event, callback);
			} else {
				element.addEventListener(event, callback, false);
			}
		},
		is_array: function (obj) {
			return obj && obj.constructor === Array;
		}
	};

	Wysiwyg.prototype = {
		create_rich_editor: function () {
			var div = document.createElement('div');
			var width = this.textarea.offsetWidth + 'px';
			util.set_style(div, {
				border: '1px solid #000',
				width: width,
				height: this.textarea.offsetHeight + 'px'
			});
			this.textarea.parentNode.insertBefore(div, this.textarea.nextSibling);

			var control_panel = document.createElement('div');
			util.set_style(control_panel, {
				width: width,
				height: '22px',
				background: 'ThreeDFace'
			});
			div.appendChild(control_panel);

			var iframe = document.createElement('iframe');
			iframe.setAttribute('frameborder', 0);
			iframe.src = '#';
			util.set_style(iframe, {
				display: 'none',
				width: width,
				height: this.textarea.offsetHeight - 32 + 'px'
			});
			div.appendChild(iframe);

			var style = document.createElement('link');
			style.rel = 'stylesheet';
			style.type = 'text/css';
			style.href = 'common.css';
			iframe.contentWindow.document.getElementsByTagName('head')[0].appendChild(style);

			var resizer = document.createElement('div');
			util.set_style(resizer, {
				width: width,
				height: '6px',
				backgroundColor: '#eee',
				cursor: 's-resize'
			});
			resizer.onmousedown = function (event) {
				event = event || window.event;
				resizer.start_position_y = event.screenY;
				resizer.start_editor_offset_height = div.offsetHeight;
				resizer.start_iframe_offset_height = iframe.offsetHeight;
				document.onmousemove = function (event) {
					event = event || window.event;
					resizer.current_position_y = event.screenY;
					var delta = resizer.current_position_y - resizer.start_position_y;
					if (delta < iframe.offsetHeight) {
						div.style.height = resizer.start_editor_offset_height + delta + 'px';
						iframe.style.height = resizer.start_iframe_offset_height + delta + 'px';
					}
				};
				//iframe.contentWindow.document.onmousemove = document.onmousemove;
				var prev_onmouseup = document.onmouseup;
				document.onmouseup = function () {
					document.onmousemove = null;
					document.onmouseup = prev_onmouseup;
				};
				return false;
			};
			div.appendChild(resizer);

			this.iframe = iframe;
			this.editor_block = div;
			this.control_panel = control_panel;
			this.resizer = resizer;

			this.init_controls();
		},
		init_controls: function () {
			var editor = this.iframe.contentWindow.document;
			util.add_event([editor, document], 'mouseup', function () {
				editor.handle_mouse_over_button = false;
			});
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
						if (editor.handle_mouse_over_button) {
							b.style.backgroundPosition = '1px 1px';
						}
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
						editor.handle_mouse_over_button = true;
						b.style.backgroundPosition = '1px 1px';
						return false;
					};
				})(button);
				button.onmouseup = (function(cmd, b) {
					return function () {
						editor.execCommand(cmd.action, null, '');
						//b.style.backgroundColor = 'ThreeDFace';
						//b.style.backgroundPosition = '0 0';
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
