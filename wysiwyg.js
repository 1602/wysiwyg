/*global jQuery*/
// http://xpoint.ru/know-how/WYSIWYG/TrueJavaScriptEditor
// http://www.mozilla.org/editor/midasdemo/
// http://www.quirksmode.org/dom/execCommand.html
// 15-17 x 21-24
(function ($) {

	var undef;
	
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
		},
		in_array: function (el, arr) {
			if (arr.indexOf) {
				return arr.indexOf(el);
			} else {
				for (var i = 0, len = arr.len; i < len; i++) {
					if (arr[i] === el) {
						return i;
					}
				}
				return -1;
			}
		},
		calc_drag_bounds: function (el) {
			// Calc visible screen bounds (this code is common)
			var w = 0, h = 0;
			if (typeof(window.innerWidth) === 'number') {// не msie
				w = window.innerWidth;
				h = window.innerHeight;
			} else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
				w = document.documentElement.clientWidth;
				h = document.documentElement.clientHeight;
			}
			var sx = 0, sy = 0;
			if (typeof window.pageYOffset === 'number') {
				sx = window.pageXOffset;
				sy = window.pageYOffset;
			} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) {
				sx = document.body.scrollLeft;
				sy = document.body.scrollTop;
			} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) {
				sx = document.documentElement.scrollLeft;
				sy = document.documentElement.scrollTop;
			}
			return {minX: sx, minY: sy, maxX: w + sx - el.offsetWidth - 20, maxY: h + sy - el.offsetHeight};
		},
		is_empty_node: function (n) {
			if (n.nodeType == 1) {
				return this.regExp.textNodes.test(n.nodeName) ? $.trim($(n).text()).length == 0 : false;
			} else if (n.nodeType == 3) {
				return /^(TABLE|THEAD|TFOOT|TBODY|TR|UL|OL|DL)$/.test(n.parentNode.nodeName)
					|| n.nodeValue == ''
					|| ($.trim(n.nodeValue).length== 0 && !(n.nextSibling && n.previousSibling && n.nextSibling.nodeType==1 && n.previousSibling.nodeType==1 && !this.regExp.block.test(n.nextSibling.nodeName) && !this.regExp.block.test(n.previousSibling.nodeName) ));
			}
			return true;
		},
		create: function(nodeName) {
			return this.wysiwyg.doc.createElement(nodeName);
		},
		create_top: function(node_name, class_name) {
			var node = document.createElement(node_name);
			if (class_name) {
				this.add_class(node, class_name);
			}
			return node;
		},
		wrap: function(n, w) {
			n = n.length ? n : [n];
			w = w.nodeName ? w : this.create(w);
			w = n[0].parentNode.insertBefore(w, n[0]);
			for (var i = 0, len = n.length; i < len; i++) {
				if (n[i] !== w) {
					w.appendChild(n[i]);
				}
			}
			return w;
		},
		remove_class: function(el, class_name) {
			if (!el || !el.getAttribute) return;
			var classes = el.getAttribute('class');
			if (!classes) return;
			classes = classes.toLowerCase().replace(class_name, '').replace(/\s+/, ' ');
			el.setAttribute('class', classes);
		},
		has_class: function(el, class_name) {
			if (!el || !el.getAttribute) return false;
			var classes = el.getAttribute('class');
			if (!classes) {
				return false;
			}
			return classes.toLowerCase().indexOf(class_name) !== -1;
		},
		add_class: function (el, class_name) {
			if (!el || !el.getAttribute || this.has_class(el, class_name)) return false;
			var classes = el.getAttribute('class');
			if (classes) {
				classes = classes.split(/\s+/);
			} else {
				classes = [];
			}
			classes.push(class_name);
			el.setAttribute('class', classes.join(' '));
		}
	};
	
	function Wysiwyg(textarea) {
		var self = this;
		this.workspace = util.create_top('div', 'wysiwyg_editor');
		this.controls = util.create_top('div', 'control_panel');
		this.source = util.create_top('textarea');
		this.iframe = util.create_top('iframe');
		this.status = util.create_top('div');
		this.is_msie = $.browser.msie;
		
		util.wysiwyg = this;
		
		var width = textarea.offsetWidth + 'px';
		var styles = {
			controls: {
				width: width,
				height: '28px',
				background: '#fff'
			},
			workspace: {
				width: width,
				height: textarea.offsetHeight + 'px'
			},
			source: {
				display: 'none',
				width: width,
				border: 0,
				mading: 0,
				height: textarea.offsetHeight - 48 + 'px'
			},
			iframe: {
				//display: 'none',
				border: '0',
				width: width,
				height: textarea.offsetHeight - 48 + 'px'
			},
			status: {
				width: width,
				height: '16px',
				backgroundColor: '#fff'
			}
		};

		textarea.parentNode.insertBefore(this.workspace, textarea.nextSibling);
		for (var i in styles) {
			if (styles.hasOwnProperty(i)) {
				util.set_style(this[i], styles[i]);
				if (i !== 'workspace') {
					this.workspace.appendChild(this[i]);
				}
			}
		}

		this.init = function () {
			this.source.value = textarea.value;
			this.source.setAttribute('name', textarea.name);
			textarea.parentNode.removeChild(textarea);
			this.win = this.iframe.contentWindow;
			this.doc = this.iframe.contentWindow.document;
			var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><link rel="stylesheet" type="text/css" href="common.css" /></head><body>' + this.source.value + '</body></html>';
			this.doc.open();
			this.doc.write(html);
			this.doc.close();
			if (!this.doc.body.firstChild) {
				this.doc.body.appendChild(this.doc.createElement('br'));
			}
			if (this.is_msie) {
				this.doc.body.contentEditable = true;
			} else {
				try { this.doc.designMode = "on"; }
				catch(e) { }
				this.doc.execCommand('styleWithCSS', false, false);
			}
			this.win.focus();

			$(this.doc).bind('keyup mouseup', function(e) {
				if (e.type == 'mouseup' || e.ctrlKey || e.metaKey || (e.keyCode >= 8 && e.keyCode <= 13) || (e.keyCode>=32 && e.keyCode<= 40) || e.keyCode == 46 || (e.keyCode >=96 && e.keyCode <= 111)) {
					self.update_controls();
				}
			});

			this.selection = new this.selection(this);
			this.init_controls();
		};

		this.init();
	}

	Wysiwyg.prototype = {
		update_controls: function () {
			
			var node = this.selection.getStart();
			var cur = node;
			var parents = [];
			var parent_classes = [];
			while (cur && cur.nodeName) {
				parents.push(cur.nodeName);
				var cls = cur.getAttribute && cur.getAttribute('class');
				if (cls) {
					parent_classes.push(cls);
				}
				cur = cur.parentNode;
			}

			var source_mode = this.source.style.display !== 'none';
			for (var i in this.buttons) {
				var b = this.buttons[i];
				if (source_mode) {
					if (b.name === 'show_source') {
						util.remove_class(b.el, 'disabled');
					} else {
						util.add_class(b.el, 'disabled');
					}
					util.remove_class(b.el, 'active');
					continue;
				}
				
				switch (b.name) {
				case 'insertimage':
					if (node && node.nodeName === 'IMG') {
						util.add_class(b.el, 'active');
					} else {
						util.remove_class(b.el, 'active');
					}
					break;
				case 'spoiler':
					if (util.in_array('spoiler', parent_classes) !== -1) {
						util.add_class(b.el, 'active');
					} else {
						util.remove_class(b.el, 'active');
					}
					break;
				case 'setcolor':
					break;
				case 'show_source':
					util.remove_class(b.el, 'active');
					break;
				default:
					try {
						if (!this.doc.queryCommandEnabled(b.name)) {
							util.add_class(b.el, 'disabled');
						} else {
							util.remove_class(b.el, 'disabled');
						}
					} catch (e) {
						continue;
					}
					try {
						if (this.doc.queryCommandState(b.name)) {
							util.add_class(b.el, 'active');
						} else {
							util.remove_class(b.el, 'active');
						}
					} catch (e) {
					}
				}
				
			}
		},
		set_status: function (text) {
			this.status_panel.innerHTML = text;
		},
		commands: [
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
				image: 'text_superscript',
				action: 'superscript'
			},
			{
				image: 'text_subscript',
				action: 'subscript'
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
				image: 'text_list_bullets',
				action: 'insertunorderedlist'
			},
			{
				image: 'text_list_numbers',
				action: 'insertorderedlist'
			},
			{
				image: 'arrow_undo',
				action: 'undo'
			},
			{
				image: 'arrow_redo',
				action: 'redo'
			}
		],
		highlight_for_node: function (node) {
			var node_names = [], name;
			if (!node) {
				return;
			}
			do {
				name = node.nodeName.toLowerCase();
				node_names.push(name);
				prev_node = node;
			} while (name !== 'body' && (node = node.parentNode));
			if (node && node.is_wysiwyg) {
				this.set_status(node_names.reverse().join(' > '));
			}
		},
		init_controls: function () {
			var w = this;
			w.buttons = [];
			var editor = w.doc;
			var body = editor.body;
			body.is_wysiwyg = true;
			body.onmouseup = function (e) {
				var e = e || window.event;
				editor.handle_mouse_over_button = false;
				//alert(e.target.nodeName);
				//w.highlight_for_node(e.target);
				//console.log(w.get_selection_bounds());
			};
			// import native commands
			var commands = [];
			for (var i in w.commands) {
				commands.push(w.commands[i]);
			}
			// add custom commands
			commands.push({
				image: 'page_code',
				command: 'show_source',
				action: function () {
					w.switch_design_mode();
				}
			});
			
			commands.push({
				image: 'comment',
				command: 'quote',
				action: function () {
					//w.selection.insertNode(w.doc.createElement('blockquote'));
					nodes = w.selection.selected({wrap : 'all', tag : 'blockquote'});
					nodes.length && w.selection.select(nodes[0], nodes[nodes.length-1]);
					w.win.focus();
				}
			});
			commands.push({
				image: 'palette',
				command: 'setcolor',
				action: function () {
					w.show_colorpicker(function (color) {
						w.doc.execCommand('forecolor', false, color);
						w.win.focus();
					});
				}
			});
			commands.push({
				image: 'link',
				command: 'createlink',
				action: function () {
					w.show_linkcreator(function (link) {
						w.doc.execCommand('createlink', false, link);
						w.win.focus();
					});
				}
			});
			commands.push({
				image: 'image',
				command: 'insertimage',
				action: function () {
					var properties;
					var selStart = w.selection.getStart();
					if (selStart && selStart.nodeName === 'IMG' && selStart.getAttribute('class') !== 'smile') {
						properties = {};
						properties.src = selStart.getAttribute('src');
						properties.alt = selStart.getAttribute('alt');
						properties.css = selStart.getAttribute('style');
						properties.border = selStart.getAttribute('border');
						properties.align = selStart.getAttribute('align');
						if (selStart.parentNode && selStart.parentNode.nodeName === 'A') {
							properties.link = selStart.parentNode.getAttribute('href');
						}
						properties.image = selStart;
					}
					w.show_image_dialog(function (properties) {
						if (properties.image) {
							var parent = properties.image.parentNode;
							if (parent.nodeName === 'A') {
								parent.parentNode.removeChild(parent);
							} else {
								parent.removeChild(properties.image);
							}
						}
						var image = w.doc.createElement('img');
						image.setAttribute('src', properties.src);
						image.setAttribute('align', properties.align);
						image.setAttribute('border', properties.border);
						image.setAttribute('alt', properties.alt);
						if (properties.css) {
							image.setAttribute('style', properties.css);
						}
						if (properties.link) {
							var link = w.doc.createElement('a');
							link.setAttribute('href', properties.link);
							link.appendChild(image);
						}
						w.selection.insertNode(properties.link ? link : image);
						w.win.focus();
					}, properties);
				}
			});
			commands.push({
				image: 'spoiler',
				command: 'spoiler',
				action: function () {
					var node = w.selection.getStart();
					var found;
					while (node && node.nodeName) {
						var cls = node.getAttribute && node.getAttribute('class');
						if (cls && cls.toLowerCase() === 'spoiler' && node.parentNode) {
							found = node;
							break;
						}
						node = node.parentNode;
					}
					if (!found) {
						var spoiler = w.doc.createElement('div');
						spoiler.setAttribute('class', 'spoiler');
						var hidden_text = w.doc.createElement('div');
						hidden_text.setAttribute('class', 'hidden_text');
						hidden_text.innerHTML = '<br/>';
						var toggler = w.doc.createElement('div');
						toggler.setAttribute('class', 'toggler');
						toggler.innerHTML = 'click to toggle spoiler';
						toggler.setAttribute('onclick', 'var s = this.nextSibling.style; s.display = s.display ? \'none\' : \'\'; return false; ');
						spoiler.appendChild(toggler);
						spoiler.appendChild(hidden_text);
						w.selection.insertNode(spoiler);
						w.selection.select(hidden_text.firstChild, hidden_text.lastChild);
					} else {
						found.parentNode.removeChild(found);
						w.selection.cleanCache();
					}
					w.win.focus();
				}
			});

			for (var i = 0, len = commands.length; i < len; i++) {
				var button = document.createElement('button');
				var cmd = commands[i];

				util.set_style(button, {
					background: 'url(images/' + cmd.image + '.png) no-repeat 2px 2px'
				});
				button.onclick = (function(cmd, b, editor) {
					return function (e) {
						if ($(b).hasClass('disabled')) {
							return false;
						}
						if (typeof cmd.action === 'function') {
							if (cmd.command) {
								// maybe this check needed?
								// w.doc.queryCommandEnabled(cmd.command);
							}
							cmd.action();
						} else {
							w.doc.execCommand(cmd.action, false, false);
						}
						w.update_controls();
						w.win.focus();
						return false;
					};
				})(cmd, button, editor);
				w.controls.appendChild(button);
				w.buttons.push({
					name: cmd.command || cmd.action,
					el: button
				});
			}
		},
		show_colorpicker: function (callback) {
			var div = document.createElement('div');
			var html = '<ul class="colorpicker"><li style="clear: both;" />';
			var colors = '0123456789ABCDEF'.split('');
			for (var r = 0; r < 16; r += 2) {
				for (var g = 0; g < 16; g += 2) {
					for (var b = 0; b < 16; b += 2) {
						var c = colors[r] + colors[g] + colors[b];
						html += '<li style="background:#' + c + '">&nbsp;</li>';
					}
					html += '<li style="clear: both;" />';
				}
				html += '</ul><ul class="colorpicker"><li style="clear: both;" />';
			}
			html += '</ul>';
			div.innerHTML = html;
			show_modal_dialog({caption: 'Выбор цвета'}, div, function (div) {
				var colors = div.firstChild.color;
				for (var i = 0, len = colors.length; i < len; i++ ) {
					if (colors[i].checked) {
						callback(colors[i].value);
						break;
					}
				}
			});
		},
		show_linkcreator: function (callback) {
			var div = document.createElement('div');
			div.innerHTML = '<form><div class="modal-type">Адрес ссылки:</div>' +
				'<input type="text" name="url" class="modal-text" />' +
				'</form>';
			show_modal_dialog({caption: 'Вставка ссылки'}, div, function (div) {
				callback(div.firstChild.url.value);
			});
		},
		show_image_dialog: function (callback, properties) {
			var div = document.createElement('div');
			div.innerHTML = '<form>' +
				[
					'<label>Адрес:</label>',
					'<input type="text" name="src" class="modal-text" />',
					'<label>Позиция в тексте:</label>',
					'<select name="align"><option value="left">Слева</option><option value="right">Справа</option><option value="baseline">По базовой линии</option></select>',
					'<input type="checkbox" name="border" id="image_border_checkbox" /><label for="image_border_checkbox">Граница</label>',
					'<label>Ссылка:</label>',
					'<input type="text" name="link" class="modal-text" />',
					'<label>ALT-текст:</label>',
					'<input type="text" name="alt" class="modal-text" />',
					'<label>CSS стиль:</label>',
					'<input type="text" name="css" class="modal-text" />'
				].join('<br/>') +
			'</form>';
			if (properties) {
				var f = div.firstChild;
				f.src.value = properties.src;
				f.alt.value = properties.alt;
				f.css.value = properties.css;
				f.border.checked = properties.border == 1;
				if (properties.link) {
					f.link.value = properties.link;
				}
				if (properties.align === 'right') {
					f.align.selectedIndex = 1;
				} else if (properties.align === 'left') {
					f.align.selectedIndex = 0;
				} else {
					f.align.selectedIndex = 2;
				}
			}
			show_modal_dialog({caption: 'Вставка изображения'}, div, function (div) {
				var f = div.firstChild;
				callback({
					src: f.src.value,
					align: f.align.options[f.align.selectedIndex].value,
					border: f.border.checked ? 1 : 0,
					css: f.css.value,
					alt: f.alt.value,
					link: f.link.value,
					image: properties && properties.image ? properties.image : null
				});
			});
		},
		switch_design_mode: function () {
			var iframe = this.iframe;

			if (this.mode && this.mode === 'design') {
				iframe.style.display = 'none';
				this.source.style.display = '';
				this.source.value = iframe.contentWindow.document.body.innerHTML;
				this.mode = 'text';
			} else {
				iframe.style.display = '';
				this.source.style.display = 'none';
				try {
					iframe.contentWindow.document.execCommand("useCSS", false, true);
				} catch (e) {

				}
				//this.export_textarea();
				this.mode = 'design';
			}
		}
	};

	function show_modal_dialog(options, contents_div, callback) {
		var overlay = document.createElement('div');
		overlay.id = 'overlay';
		document.body.appendChild(overlay);

		var dialog_wrapper = document.createElement('div');
		dialog_wrapper.setAttribute('class', 'modalwindow');
		overlay.appendChild(dialog_wrapper);

		// round corners
		var corners = ['mtl', 'mtr', 'mbl', 'mbr'];
		for (var i = 0; i < 4; i++ ) {
			var corner = document.createElement('div');
			corner.setAttribute('class', corners[i]);
			dialog_wrapper.appendChild(corner);
		}

		var dialog = document.createElement('div');
		dialog.setAttribute('class', 'modalmain');
		dialog_wrapper.appendChild(dialog);

		var header = document.createElement('div');
		header.innerHTML = options.caption;
		header.setAttribute('class', 'modaltitle');
		dialog.appendChild(header);

		// make header draggable
		var init_pos = {x: 0, y: 0, t: 0, l: 0};
		header.onmousedown = function (e) {
			e = e || window.event;
			init_pos.x = e.clientX;
			init_pos.y = e.clientY;
			init_pos.t = dialog_wrapper.offsetTop;
			init_pos.l = dialog_wrapper.offsetLeft;
			init_pos.bounds = util.calc_drag_bounds(dialog_wrapper);
			document.onmouseup = function () {
				document.onmousemove = null;
				document.onmouseup = null;
			};
			document.onmousemove = function (e) {
				e = e || window.event;
				var x = init_pos.l + e.clientX - init_pos.x;
				var y = init_pos.t + e.clientY - init_pos.y;
				x = Math.max(x, init_pos.bounds.minX);
				x = Math.min(x, init_pos.bounds.maxX);
				y = Math.max(y, init_pos.bounds.minY);
				y = Math.min(y, init_pos.bounds.maxY);
				dialog_wrapper.style.left = x + 'px';
				dialog_wrapper.style.top = y + 'px';
			};
			return false;
		}

		var descr_div = document.createElement('div');
		descr_div.setAttribute('class', 'modaldescr');
		dialog.appendChild(descr_div);
		descr_div.appendChild(contents_div);

		var footer = document.createElement('div');
		footer.setAttribute('class', 'modalclose');
		dialog.appendChild(footer);

		var btn_ok = document.createElement('button');
		btn_ok.innerHTML = 'OK';
		footer.appendChild(btn_ok);
		btn_ok.onclick = function () {
			callback(contents_div);
			overlay.parentNode.removeChild(overlay);
		}

		var btn_cancel = document.createElement('button');
		btn_cancel.innerHTML = 'Cancel';
		btn_cancel.onclick = function () {
			overlay.parentNode.removeChild(overlay);
		}
		footer.appendChild(btn_cancel);

		overlay.style.visibility = 'visible';
	}

	Wysiwyg.prototype.selection = function(rte) {
		this.rte      = rte;
		var self      = this;
		this.w3cRange = null;
		var start, end, node, bm;

		$(this.rte.doc)
			.keyup(function(e) {
				if (e.ctrlKey || e.metaKey || (e.keyCode >= 8 && e.keyCode <= 13) || (e.keyCode>=32 && e.keyCode<= 40) || e.keyCode == 46 || (e.keyCode >=96 && e.keyCode <= 111)) {
					self.cleanCache();
				}
			})
			.mousedown(function(e) {
				if (e.target.nodeName == 'HTML') {
					start = self.rte.doc.body;
				} else {
					start = e.target;
				}
				end   = node = null;
			})
			.mouseup(function(e) {
				if (e.target.nodeName == 'HTML') {
					end = self.rte.doc.body;
				} else {
					end = e.target;
				}
				end  = e.target;
				node = null;
			}).click();

		/**
		 * возвращает selection
		 *
		 * @return  Selection
		 **/
		function selection() {
			return self.rte.win.getSelection ? self.rte.win.getSelection() : self.rte.win.document.selection;
		}

		/**
		 * Вспомогательная функция
		 * Возвращает самого верхнего родителя, отвечающего условию - текущая нода - его единственная непустая дочерняя нода
		 *
		 * @param   DOMElement  n нода, для которой ищем родителя
		 * @param   DOMElement  p если задана - нода, выше которой не поднимаемся
		 * @param   String      s строна поиска (left||right||null)
		 * @return  DOMElement
		 **/
		function realSelected(n, p, s) {
			while (n.nodeName != 'BODY' && n.parentNode && n.parentNode.nodeName != 'BODY' && (p ? n!== p && n.parentNode != p : 1) && ((s=='left' && self.rte.dom.isFirstNotEmpty(n)) || (s=='right' && self.rte.dom.isLastNotEmpty(n)) || (self.rte.dom.isFirstNotEmpty(n) && self.rte.dom.isLastNotEmpty(n))) ) {
				n = n.parentNode;
			}
			return n;
		}

		/**
		 * Возвращает TRUE, если выделение "схлопнуто"
		 *
		 * @return  bool
		 **/
		this.collapsed = function() {
			return this.getRangeAt().isCollapsed();
		}

		/**
		 * "Схлопывает" выделение 
		 *
		 * @param   bool  toStart  схлопнуть к начальной точке
		 * @return  void
		 **/
		this.collapse = function(toStart) {
			this.getRangeAt().collapse(toStart ? true : false);
		}

		/**
		 * Возвращает TextRange
		 * Для нормальных браузеров - нативный range
		 * для "самизнаетечего" - эмуляцию w3c range
		 *
		 * @return  range|w3cRange
		 **/
		this.getRangeAt = function(updateW3cRange) {
			if (this.rte.is_msie) {
				if (!this.w3cRange) {
					this.w3cRange = new this.rte.w3cRange(this.rte);
				}
				updateW3cRange && this.w3cRange.update();
				return this.w3cRange;
			}

			var s = selection();
			var r = s.rangeCount > 0 ? s.getRangeAt(0) : this.rte.doc.createRange();
			r.getStart = function() {
				return this.startContainer.nodeType==1 
					? this.startContainer.childNodes[Math.min(this.startOffset, this.startContainer.childNodes.length-1)] 
					: this.startContainer;
			}

			r.getEnd = function() {
				return this.endContainer.nodeType==1 
					? this.endContainer.childNodes[ Math.min(this.startOffset == this.endOffset ? this.endOffset : this.endOffset-1, this.endContainer.childNodes.length-1)] 
					: this.endContainer;
			}
			r.isCollapsed = function() {
				return this.collapsed;
			}
			return r;
		}

		this.saveIERange = function() {
			if (this.rte.is_msie) {
				bm = this.getRangeAt().getBookmark();
			}
		}

		this.restoreIERange = function() {
			this.rte.is_msie && bm && this.getRangeAt().moveToBookmark(bm);
		}

		/**
		 * Выделяет ноды
		 *
		 * @param   DOMNode  s  нода начала выделения
		 * @param   DOMNode  e  нода конца выделения
		 * @return  selection
		 **/
		this.select = function(s, e) {
			e = e||s;
			var r = this.getRangeAt();
			r.setStartBefore(s);
			r.setEndAfter(e);
			if (this.is_msie) {
				r.select();
			} else {
				var s = selection();
				s.removeAllRanges();
				s.addRange(r);
			}
			return this.cleanCache();
		}

		/**
		 * Выделяет содержимое ноды
		 *
		 * @param   Element  n  нода
		 * @return  selection
		 **/
		this.selectContents = function(n) {
			var r = this.getRangeAt();
			if (n && n.nodeType == 1) {
				if (this.is_msie) {
					r.range();
					r.r.moveToElementText(n.parentNode);
					r.r.select();
				} else {
					try {
						r.selectNodeContents(n);
					} catch (e) {
						return this.rte.log('unable select node contents '+n);
					}
					var s = selection();
					s.removeAllRanges();
					s.addRange(r);
				}
			}
			return this;
		}

		/**
		 * Вставляет ноду в текущее выделение
		 *
		 * @param   Element  n  нода
		 * @return  selection
		 **/
		this.insertNode = function(n, collapse) {
			if (collapse && !this.collapsed()) {
				this.collapse();
			}

			if (this.rte.is_msie) {
				var html = n.nodeType == 3 ? n.nodeValue : $(this.rte.dom.create('span')).append($(n)).html();
				var r = this.getRangeAt();
				r.insertNode(html);
			} else {
				var r = this.getRangeAt();
				r.insertNode(n);
				r.setStartAfter(n);
				r.setEndAfter(n);
				var s = selection();
				s.removeAllRanges();
				s.addRange(r);
			}
			return this.cleanCache();
		}

		/**
		 * Вставляет html в текущее выделение
		 *
		 * @param   Element  n  нода
		 * @return  selection
		 **/
		this.insertHtml = function(html, collapse) {
			if (collapse && !this.collapsed()) {
				this.collapse();
			}

			if (this.is_msie) {
				this.getRangeAt().range().pasteHTML(html);
			} else {
				var n = $(this.rte.dom.create('span')).html(html||'').get(0);
				this.insertNode(n);
				$(n).replaceWith($(n).html());
			}
			return this.cleanCache();
		}

		/**
		 * Вставляет ноду в текущее выделение
		 *
		 * @param   Element  n  нода
		 * @return  selection
		 **/
		this.insertText = function(text, collapse) {
			var n = this.rte.doc.createTextNode(text);
			return this.insertHtml(n.nodeValue);
		}

		/**
		 * Очищает кэш
		 *
		 * @return  selection
		 **/
		this.cleanCache = function() {
			start = end = node = null;
			return this;
		}

		/**
		 * Возвращает ноду начала выделения
		 *
		 * @return  DOMElement
		 **/
		this.getStart = function() {
			if (!start) {
				var r = this.getRangeAt();
				start = r.getStart();
			}
			return start;
		}

		/**
		 * Возвращает ноду конца выделения
		 *
		 * @return  DOMElement
		 **/
		this.getEnd = function() {
			if (!end) {
				var r = this.getRangeAt();
				end = r.getEnd();
			}
			return end;
		}

		/**
		 * Возвращает выбраную ноду (общий контейнер всех выбранных нод)
		 *
		 * @return  Element
		 **/
		this.getNode = function() {
			if (!node) {
				node = this.rte.dom.findCommonAncestor(this.getStart(), this.getEnd());
			}
			return node;
		}

		/**
		 * Возвращает массив выбранных нод
		 *
		 * @param   Object  o  параметры получения и обработки выбраных нод
		 * @return  Array
		 **/
		this.selected = function(o) {
			var opts = {
				collapsed : false,  // вернуть выделение, даже если оно схлопнуто
				blocks    : false,  // блочное выделение
				filter    : false,  // фильтр результатов
				wrap      : 'text', // что оборачиваем
				tag       : 'span'  // во что оборачиваем
			}
			opts = $.extend({}, opts, o);

			// блочное выделение - ищем блочную ноду, но не таблицу
			if (opts.blocks) {
				var n  = this.getNode(), _n = null;
				if (_n = this.rte.dom.selfOrParent(n, 'selectionBlock') ) {
					return [_n];
				} 
			}

			var sel    = this.selectedRaw(opts.collapsed, opts.blocks);
			var ret    = [];
			var buffer = [];
			var ndx    = null;

			// оборачиваем ноды в буффере
			function wrap() {

				function allowParagraph() {
					for (var i=0; i < buffer.length; i++) {
						if (buffer[i].nodeType == 1 && (self.rte.dom.selfOrParent(buffer[i], /^P$/) || $(buffer[i]).find('p').length>0)) {
							return false;
						}
					};
					return true;
				} 

				if (buffer.length>0) {
					var tag  = opts.tag == 'p' && !allowParagraph() ? 'div' : opts.tag;
					var n    = util.wrap(buffer, tag);
					ret[ndx] = n;
					ndx      = null;
					buffer   = [];
				}
			}

			// добавляем ноды в буффер
			function addToBuffer(n) {
				if (n.nodeType == 1) {
					if (/^(THEAD|TFOOT|TBODY|COL|COLGROUP|TR)$/.test(n.nodeName)) {
						$(n).find('td,th').each(function() {
							var tag = opts.tag == 'p' && $(this).find('p').length>0 ? 'div' : opts.tag;
							var n = self.rte.dom.wrapContents(this, tag);
							return ret.push(n);
						})
					} else if (/^(CAPTION|TD|TH|LI|DT|DD)$/.test(n.nodeName)) {
						var tag = opts.tag == 'p' && $(n).find('p').length>0 ? 'div' : opts.tag;
						var n = self.rte.dom.wrapContents(n, tag);
						return ret.push(n);
					} 
				} 
				var prev = buffer.length>0 ? buffer[buffer.length-1] : null;
				if (prev && prev != self.rte.dom.prev(n)) {
					wrap();
				}
				buffer.push(n); 
				if (ndx === null) {
					ndx = ret.length;
					ret.push('dummy'); // заглушка для оборачиваемых элементов
				}
			}

			if (sel.nodes.length>0) {

				for (var i=0; i < sel.nodes.length; i++) {
					var n = sel.nodes[i];
						// первую и посл текстовые ноды разрезаем, если необходимо
						 if (n.nodeType == 3 && (i==0 || i == sel.nodes.length-1) && $.trim(n.nodeValue).length>0) {
							if (i==0 && sel.so>0) {
								n = n.splitText(sel.so);
							}
							if (i == sel.nodes.length-1 && sel.eo>0) {
								n.splitText(i==0 && sel.so>0 ? sel.eo - sel.so : sel.eo);
							}
						}

						switch (opts.wrap) {
							// оборачиваем только текстовые ноды с br
							case 'text':
								if ((n.nodeType == 1 && n.nodeName == 'BR') || (n.nodeType == 3 && $.trim(n.nodeValue).length>0)) {
									addToBuffer(n);
								} else if (n.nodeType == 1) {
									ret.push(n);
								}
								break;
							// оборачиваем все инлайн элементы	
							case 'inline':
								if (this.rte.dom.isInline(n)) {
									addToBuffer(n);
								} else if (n.nodeType == 1) {

									ret.push(n);
								}
								break;
							// оборачиваем все	
							case 'all':
								if (n.nodeType == 1 || !util.is_empty_node(n)) {
									addToBuffer(n);
								}
								break;
							// ничего не оборачиваем
							default:
								if (n.nodeType == 1 || !util.is_empty_node(n)) {
									ret.push(n);
								}
						}
				};
				wrap();
			}
			// this.rte.log('buffer')
			// this.rte.log(buffer)
			// this.rte.log('ret')
			// this.rte.log(ret)		
			return opts.filter ? this.rte.dom.filter(ret, opts.filter) : ret;
		}

		this.dump = function(ca, s, e, so, eo) {
			var r = this.getRangeAt();
			this.rte.log('commonAncestorContainer');
			this.rte.log(ca || r.commonAncestorContainer);
			// this.rte.log('commonAncestorContainer childs num')
			// this/rte.log((ca||r.commonAncestorContainer).childNodes.length)
			this.rte.log('startContainer');
			this.rte.log(s || r.startContainer);
			this.rte.log('startOffset: '+(so>=0 ? so : r.startOffset));
			this.rte.log('endContainer');
			this.rte.log(e||r.endContainer);
			this.rte.log('endOffset: '+(eo>=0 ? eo : r.endOffset));
		}

		/**
		 * Возвращает массив выбранных нод, как есть
		 *
		 * @param   bool           возвращать если выделение схлопнуто
		 * @param   bool           "блочное" выделение (текстовые ноды включаются полностью, не зависимо от offset)
		 * @return  Array
		 **/
		this.selectedRaw = function(collapsed, blocks) {
			var res = {so : null, eo : null, nodes : []};
			var r   = this.getRangeAt(true);
			var ca  = r.commonAncestorContainer;
			var s, e;  // start & end nodes
			var sf  = false; // start node fully selected
			var ef  = false; // end node fully selected

			// возвращает true, если нода не текстовая или выделена полностью
			function isFullySelected(n, s, e) {
				if (n.nodeType == 3) {
					e = e>=0 ? e : n.nodeValue.length;
					return (s==0 && e==n.nodeValue.length) || $.trim(n.nodeValue).length == $.trim(n.nodeValue.substring(s, e)).length;
				} 
				return true;
			}

			// возвращает true, если нода пустая или в ней не выделено ни одного непробельного символа
			function isEmptySelected(n, s, e) {
				if (n.nodeType == 1) {
					return self.rte.dom.isEmpty(n);
				} else if (n.nodeType == 3) {
					return $.trim(n.nodeValue.substring(s||0, e>=0 ? e : n.nodeValue.length)).length == 0;
				} 
				return true;
			}

			//this.dump()
			// начальная нода
			if (r.startContainer.nodeType == 1) {
				if (r.startOffset<r.startContainer.childNodes.length) {
					s = r.startContainer.childNodes[r.startOffset];
					res.so = s.nodeType == 1 ? null : 0;
				} else {
					s = r.startContainer.childNodes[r.startOffset-1];
					res.so = s.nodeType == 1 ? null : s.nodeValue.length;
				}
			} else {
				s = r.startContainer;
				res.so = r.startOffset;
			} 

			// выделение схлопнуто
			if (r.collapsed) {
				if (collapsed) {
					//  блочное выделение
					if (blocks) {
						s = realSelected(s);
						if (!util.is_empty_node(s) || (s = this.rte.dom.next(s))) {
							res.nodes = [s];
						} 

						// добавляем инлайн соседей 
						if (this.rte.dom.isInline(s)) {
							res.nodes = this.rte.dom.toLineStart(s).concat(res.nodes, this.rte.dom.toLineEnd(s));
						}

						// offset для текстовых нод
						if (res.nodes.length>0) {
							res.so = res.nodes[0].nodeType == 1 ? null : 0;
							res.eo = res.nodes[res.nodes.length-1].nodeType == 1 ? null : res.nodes[res.nodes.length-1].nodeValue.length;
						}

					} else if (!util.is_empty_node(s)) {
						res.nodes = [s];
					}

				}
				return res;
			}

			// конечная нода
			if (r.endContainer.nodeType == 1) {
				e = r.endContainer.childNodes[r.endOffset-1];
				res.eo = e.nodeType == 1 ? null : e.nodeValue.length;
			} else {
				e = r.endContainer;
				res.eo = r.endOffset;
			} 
			// this.rte.log('select 1')
			//this.dump(ca, s, e, res.so, res.eo)

			// начальная нода выделена полностью - поднимаемся наверх по левой стороне
			if (s.nodeType == 1 || blocks || isFullySelected(s, res.so, s.nodeValue.length)) {
				//			this.rte.log('start text node is fully selected')
				s = realSelected(s, ca, 'left');
				sf = true;
				res.so = s.nodeType == 1 ? null : 0;
			}
			// конечная нода выделена полностью - поднимаемся наверх по правой стороне
			if (e.nodeType == 1 || blocks || isFullySelected(e, 0,  res.eo)) {
				//			this.rte.log('end text node is fully selected')
				e = realSelected(e, ca, 'right');
				ef = true;
				res.eo = e.nodeType == 1 ? null : e.nodeValue.length;
			}

			// блочное выделение - если ноды не элементы - поднимаемся к родителю, но ниже контейнера
			if (blocks) {
				if (s.nodeType != 1 && s.parentNode != ca && s.parentNode.nodeName != 'BODY') {
					s = s.parentNode;
					res.so = null;
				}
				if (e.nodeType != 1 && e.parentNode != ca && e.parentNode.nodeName != 'BODY') {
					e = e.parentNode;
					res.eo = null;
				}
			}

			// если контенер выделен полностью, поднимаемся наверх насколько можно
			if (s.parentNode == e.parentNode && s.parentNode.nodeName != 'BODY' && (sf && this.rte.dom.isFirstNotEmpty(s)) && (ef && this.rte.dom.isLastNotEmpty(e))) {
				//			this.rte.log('common parent')
				s = e = s.parentNode;
				res.so = s.nodeType == 1 ? null : 0;
				res.eo = e.nodeType == 1 ? null : e.nodeValue.length;
			}
			// начальная нода == конечной ноде
			if (s == e) {
				//			this.rte.log('start is end')
				if (!util.is_empty_node(s)) {
					res.nodes.push(s);
				}
				return res;
			}
			 // this.rte.log('start 2')
			  //this.dump(ca, s, e, res.so, res.eo)

			// находим начальную и конечную точки - ноды из иерархии родителей начальной и конечно ноды, у которых родитель - контейнер
			var sp = s;
			while (sp.nodeName != 'BODY' && sp.parentNode !== ca && sp.parentNode.nodeName != 'BODY') {
				sp = sp.parentNode;
			}
			//this.rte.log(s.nodeName)
			// this.rte.log('start point')
			// this.rte.log(sp)

			var ep = e;
			//		this.rte.log(ep)
			while (ep.nodeName != 'BODY' && ep.parentNode !== ca && ep.parentNode.nodeName != 'BODY') {
				this.rte.log(ep)
				ep = ep.parentNode;
			}
			// this.rte.log('end point')
			// this.rte.log(ep)

			//  если начальная нода не пустая - добавляем ее
			if (!isEmptySelected(s, res.so, s.nodeType==3 ? s.nodeValue.length : null)) {
				res.nodes.push(s);
			}
			// поднимаемся от начальной ноды до начальной точки
			var n = s;
			while (n !== sp) {
				var _n = n;
				while ((_n = this.rte.dom.next(_n))) {
						res.nodes.push(_n);
				}
				n = n.parentNode;
			}
			// от начальной точки до конечной точки
			n = sp;
			while ((n = this.rte.dom.next(n)) && n!= ep ) {
				//			this.rte.log(n)
				res.nodes.push(n);
			}
			// поднимаемся от конечной ноды до конечной точки, результат переворачиваем
			var tmp = [];
			n = e;
			while (n !== ep) {
				var _n = n;
				while ((_n = this.rte.dom.prev(_n))) {
					tmp.push(_n);
				}
				n = n.parentNode;
			}
			if (tmp.length) {
				res.nodes = res.nodes.concat(tmp.reverse());
			}
			//  если конечная нода не пустая и != начальной - добавляем ее
			if (!isEmptySelected(e, 0, e.nodeType==3 ? res.eo : null)) {
				res.nodes.push(e);
			}

			if (blocks) {
				// добавляем инлайн соседей слева
				if (this.rte.dom.isInline(s)) {
					res.nodes = this.rte.dom.toLineStart(s).concat(res.nodes);
					res.so    = res.nodes[0].nodeType == 1 ? null : 0;
				}
				// добавляем инлайн соседей справа
				if (this.rte.dom.isInline(e)) {
					res.nodes = res.nodes.concat(this.rte.dom.toLineEnd(e));
					res.eo    = res.nodes[res.nodes.length-1].nodeType == 1 ? null : res.nodes[res.nodes.length-1].nodeValue.length;
				}
			}

			// все радуются! :)
			return res;
		}

	};

	Wysiwyg.prototype.w3cRange = function(rte) {
		var self                     = this;
		this.rte                     = rte;
		this.r                       = null;
		this.collapsed               = true;
		this.startContainer          = null;
		this.endContainer            = null;
		this.startOffset             = 0;
		this.endOffset               = 0;
		this.commonAncestorContainer = null;

		this.range = function() {
			try { 
				this.r = this.rte.window.document.selection.createRange(); 
			} catch(e) { 
				this.r = this.rte.doc.body.createTextRange(); 
			}
			return this.r;
		}

		this.insertNode = function(html) {
			this.range();
			self.r.collapse(false)
			var r = self.r.duplicate();
			r.pasteHTML(html);
		}

		this.getBookmark = function() {
			this.range();
			if (this.r.item) {
				var n = this.r.item(0);
				this.r = this.rte.doc.body.createTextRange();
				this.r.moveToElementText(n);
			}
			return this.r.getBookmark();
		}

		this.moveToBookmark = function(bm) {
			this.rte.window.focus();
			this.range().moveToBookmark(bm);
			this.r.select();
		}

		/**
		 * Обновляет данные о выделенных нодах
		 *
		 * @return void
		 **/
		this.update = function() {

			function _findPos(start) {
				var marker = '\uFEFF';
				var ndx = offset = 0;
				var r = self.r.duplicate();
				r.collapse(start);
				var p = r.parentElement();
				if (!p || p.nodeName == 'HTML') {
					return {parent : self.rte.doc.body, ndx : ndx, offset : offset};
				}

				r.pasteHTML(marker);

				childs = p.childNodes;
				for (var i=0; i < childs.length; i++) {
					var n = childs[i];
					if (i>0 && (n.nodeType!==3 || childs[i-1].nodeType !==3)) {
						ndx++;
					}
					if (n.nodeType !== 3) {
						offset = 0;
					} else {
						var pos = n.nodeValue.indexOf(marker);
						if (pos !== -1) {
							offset += pos;
							break;
						}
						offset += n.nodeValue.length;
					}
				};
				r.moveStart('character', -1);
				r.text = '';
				return {parent : p, ndx : Math.min(ndx, p.childNodes.length-1), offset : offset};
			}

			this.range();
			this.startContainer = this.endContainer = null;

			if (this.r.item) {
				this.collapsed = false;
				var i = this.r.item(0);
				this.setStart(i.parentNode, this.rte.dom.indexOf(i));
				this.setEnd(i.parentNode, this.startOffset+1);
			} else {
				this.collapsed = this.r.boundingWidth == 0;
				var start = _findPos(true); 
				var end   = _findPos(false);

				start.parent.normalize();
				end.parent.normalize();
				start.ndx = Math.min(start.ndx, start.parent.childNodes.length-1);
				end.ndx = Math.min(end.ndx, end.parent.childNodes.length-1);
				if (start.parent.childNodes[start.ndx].nodeType && start.parent.childNodes[start.ndx].nodeType == 1) {
					this.setStart(start.parent, start.ndx);
				} else {
					this.setStart(start.parent.childNodes[start.ndx], start.offset);
				}
				if (end.parent.childNodes[end.ndx].nodeType && end.parent.childNodes[end.ndx].nodeType == 1) {
					this.setEnd(end.parent, end.ndx);
				} else {
					this.setEnd(end.parent.childNodes[end.ndx], end.offset);
				}
				// this.dump();
				this.select();
			}
			return this;
		}

		this.isCollapsed = function() {
			this.range();
			this.collapsed = this.r.item ? false : this.r.boundingWidth == 0;
			return this.collapsed;
		}

		/**
		 * "Схлопывает" выделение
		 *
		 * @param  bool  toStart - схлопывать выделение к началу или к концу
		 * @return void
		 **/
		this.collapse = function(toStart) {
			this.range();
			if (this.r.item) {
				var n = this.r.item(0);
				this.r = this.rte.doc.body.createTextRange();
				this.r.moveToElementText(n);
			}
			this.r.collapse(toStart);
			this.r.select();
			this.collapsed = true;
		}

		this.getStart = function() {
			this.range();
			if (this.r.item) {
				return this.r.item(0);
			}
			var r = this.r.duplicate();
			r.collapse(true);
			var s = r.parentElement();
			return s && s.nodeName == 'BODY' ? s.firstChild : s;
		}

		this.getEnd = function() {
			this.range();
			if (this.r.item) {
				return this.r.item(0);
			}
			var r = this.r.duplicate();
			r.collapse(false);
			var e = r.parentElement();
			return e && e.nodeName == 'BODY' ? e.lastChild : e;
		}

		/**
		 * Устанавливает начaло выделения на указаную ноду
		 *
		 * @param  Element  node    нода
		 * @param  Number   offset  отступ от начала ноды
		 * @return void
		 **/
		this.setStart = function(node, offset) {
			this.startContainer = node;
			this.startOffset    = offset;
			if (this.endContainer) {
				this.commonAncestorContainer = this.rte.dom.findCommonAncestor(this.startContainer, this.endContainer);
			}
		}

		/**
		 * Устанавливает конец выделения на указаную ноду
		 *
		 * @param  Element  node    нода
		 * @param  Number   offset  отступ от конца ноды
		 * @return void
		 **/
		this.setEnd = function(node, offset) {
			this.endContainer = node;
			this.endOffset    = offset;
			if (this.startContainer) {
				this.commonAncestorContainer = this.rte.dom.findCommonAncestor(this.startContainer, this.endContainer);
			}
		}

		/**
		 * Устанавливает начaло выделения перед указаной нодой
		 *
		 * @param  Element  node    нода
		 * @return void
		 **/
		this.setStartBefore = function(n) {
			if (n.parentNode) {
				this.setStart(n.parentNode, this.rte.dom.indexOf(n));
			}
		}

		/**
		 * Устанавливает начaло выделения после указаной ноды
		 *
		 * @param  Element  node    нода
		 * @return void
		 **/
		this.setStartAfter = function(n) {
			if (n.parentNode) {
				this.setStart(n.parentNode, this.rte.dom.indexOf(n)+1);
			}
		}

		/**
		 * Устанавливает конец выделения перед указаной нодой
		 *
		 * @param  Element  node    нода
		 * @return void
		 **/
		this.setEndBefore = function(n) {
			if (n.parentNode) {
				this.setEnd(n.parentNode, this.rte.dom.indexOf(n));
			}
		}

		/**
		 * Устанавливает конец выделения после указаной ноды
		 *
		 * @param  Element  node    нода
		 * @return void
		 **/
		this.setEndAfter = function(n) {
			if (n.parentNode) {
				this.setEnd(n.parentNode, this.rte.dom.indexOf(n)+1);
			}
		}

		/**
		 * Устанавливает новое выделение после изменений
		 *
		 * @return void
		 **/
		this.select = function() {
			function getPos(n, o) {
				if (n.nodeType != 3) {
					return -1;
				}
				var c   ='\uFEFF';
				var val = n.nodeValue;
				var r   = self.rte.doc.body.createTextRange();
				n.nodeValue = val.substring(0, o) + c + val.substring(o);
				r.moveToElementText(n.parentNode);
				r.findText(c);
				var p = Math.abs(r.moveStart('character', -0xFFFFF));
				n.nodeValue = val;
				return p;
			};

			this.r = this.rte.doc.body.createTextRange(); 
			var so = this.startOffset;
			var eo = this.endOffset;
			var s = this.startContainer.nodeType == 1 
				? this.startContainer.childNodes[Math.min(so, this.startContainer.childNodes.length - 1)]
				: this.startContainer;
			var e = this.endContainer.nodeType == 1 
				? this.endContainer.childNodes[Math.min(so == eo ? eo : eo - 1, this.endContainer.childNodes.length - 1)]
				: this.endContainer;

			if (this.collapsed) {
				if (s.nodeType == 3) {
					var p = getPos(s, so);
					this.r.move('character', p);
				} else {
					this.r.moveToElementText(s);
					this.r.collapse(true);
				}
			} else {
				var r  = this.rte.doc.body.createTextRange(); 
				var sp = getPos(s, so);
				var ep = getPos(e, eo);
				if (s.nodeType == 3) {
					this.r.move('character', sp);
				} else {
					this.r.moveToElementText(s);
				}
				if (e.nodeType == 3) {
					r.move('character', ep);
				} else {
					r.moveToElementText(e);
				}
				this.r.setEndPoint('EndToEnd', r);
			}

			try {
				this.r.select();
			} catch(e) {

			}
			if (r) {
				r = null;
			}
		}

		this.dump = function() {
			this.rte.log('collapsed: '+this.collapsed);
			//this.rte.log('commonAncestorContainer: '+this.commonAncestorContainer.nodeName||'#text')
			this.rte.log('startContainer: '+(this.startContainer ? this.startContainer.nodeName : 'non'));
			this.rte.log('startOffset: '+this.startOffset);
			this.rte.log('endContainer: '+(this.endContainer ? this.endContainer.nodeName : 'none'));
			this.rte.log('endOffset: '+this.endOffset);
		}

	};

	$.fn.wysiwyg = function () {
		return this.each(function () {
			wysiwyg = new Wysiwyg(this);
		});
	};
})(jQuery);
