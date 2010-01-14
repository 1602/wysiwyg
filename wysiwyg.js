/*global jQuery*/
// http://xpoint.ru/know-how/WYSIWYG/TrueJavaScriptEditor
// http://www.mozilla.org/editor/midasdemo/
// http://www.quirksmode.org/dom/execCommand.html
// 15-17 x 21-24
(function ($) {

	var undef;

	var util = {
		get_parents: function (node) {
			var parents = [];
			while (node = node.parentNode) {
				parents.push(node);
			}
			return parents;
		},
		deepest_parent_of: function (node1, node2) {
			if (node1 == node2) {
				return node1;
			} else if (node1.nodeName == 'BODY' || node2.nodeName == 'BODY') {
				return node1;
			}
			var parents1 = this.get_parents(node1).reverse(), len1 = parents1.length;
			var parents2 = this.get_parents(node2).reverse(), len2 = parents2.length;
			var len = Math.min(len1, len2);
			var common_parent;
			for (var i = 0; i < len; i++) {
				if (parents1[i] === parents2[i]) {
					c = parents1[i];
				} else {
					break;
				}
			}
			return c;
		},
		regExp: {
			textNodes         : /^(A|ABBR|ACRONYM|ADDRESS|B|BDO|BIG|BLOCKQUOTE|CAPTION|CENTER|CITE|CODE|DD|DEL|DFN|DIV|DT|EM|FIELDSET|FONT|H[1-6]|I|INS|KBD|LABEL|LEGEND|LI|MARQUEE|NOBR|NOEMBED|P|PRE|Q|SAMP|SMALL|SPAN|STRIKE|STRONG|SUB|SUP|TD|TH|TT|VAR)$/,
			textContainsNodes : /^(A|ABBR|ACRONYM|ADDRESS|B|BDO|BIG|BLOCKQUOTE|CAPTION|CENTER|CITE|CODE|DD|DEL|DFN|DIV|DL|DT|EM|FIELDSET|FONT|H[1-6]|I|INS|KBD|LABEL|LEGEND|LI|MARQUEE|NOBR|NOEMBED|OL|P|PRE|Q|SAMP|SMALL|SPAN|STRIKE|STRONG|SUB|SUP|TABLE|THEAD|TBODY|TFOOT|TD|TH|TR|TT|UL|VAR)$/,
			block             : /^(APPLET|BLOCKQUOTE|BR|CAPTION|CENTER|COL|COLGROUP|DD|DIV|DL|DT|H[1-6]|EMBED|FIELDSET|LI|MARQUEE|NOBR|OBJECT|OL|P|PRE|TABLE|THEAD|TBODY|TFOOT|TD|TH|TR|UL)$/,
			selectionBlock    : /^(APPLET|BLOCKQUOTE|BR|CAPTION|CENTER|COL|COLGROUP|DD|DIV|DL|DT|H[1-6]|EMBED|FIELDSET|LI|MARQUEE|NOBR|OBJECT|OL|P|PRE|TD|TH|TR|UL)$/,		
			header            : /^H[1-6]$/,
			formElement       : /^(FORM|INPUT|HIDDEN|TEXTAREA|SELECT|BUTTON)$/
		},
		is_first_not_empty: function(n) {
			while ((n = this.prev_node(n))) {
				if (n.nodeType == 1 || (n.nodeType == 3 && $.trim(n.nodeValue)!='' ) ) {
					return false;
				}
			}
			return true;
		},
		is_last_not_empty: function(n) {
			while ((n = this.prev_node(n))) {
				if (!this.is_empty_node(n)) {
					return false;
				}
			}
			return true;
		},
		next_node: function(n) {
			while (n.nextSibling && (n = n.nextSibling)) {
				if (n.nodeType == 1 || (n.nodeType == 3 && !this.is_empty_node(n))) {
					return n;
				}
			}
			return null;
		},
		prev_node: function(n) {
			while (n.previousSibling && (n = n.previousSibling)) {
				if (n.nodeType == 1 || (n.nodeType ==3 && !this.is_empty_node(n))) {
					return n;
				}
			}
			return null;
		},
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
				for (var i = 0, len = arr.length; i < len; i++) {
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
				return util.regExp.textNodes.test(n.nodeName) ? $.trim($(n).text()).length == 0 : false;
			} else if (n.nodeType == 3) {
				return /^(TABLE|THEAD|TFOOT|TBODY|TR|UL|OL|DL)$/.test(n.parentNode.nodeName)
					|| n.nodeValue == ''
					|| ($.trim(n.nodeValue).length== 0 && !(n.nextSibling && n.previousSibling && n.nextSibling.nodeType==1 && n.previousSibling.nodeType==1 && !this.regExp.block.test(n.nextSibling.nodeName) && !this.regExp.block.test(n.previousSibling.nodeName) ));
			}
			return true;
		},
		create: function(nodeName, class_name, parent_node) { // todo: uncopypaste
			var node = this.wysiwyg.doc.createElement(nodeName);
			if (class_name) {
				this.add_class(node, class_name);
			}
			if (parent_node) {
				parent_node.appendChild(node);
			}
			return node;
		},
		create_top: function(node_name, class_name, parent_node) { // todo: uncopypaste
			var node = document.createElement(node_name);
			if (class_name) {
				this.add_class(node, class_name);
			}
			if (parent_node) {
				parent_node.appendChild(node);
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
			el.className = classes;
		},
		has_class: function(el, class_name) {
			if (!el || !el.className) {
				return false;
			}
			return el.className.toLowerCase().indexOf(class_name.toLowerCase()) !== -1;
		},
		index_of_child: function(node) {
			return 0;
			var ix = 0;
			while ((n = this.prev_node(node))) {
				ix++;
			}
			return ix;
		},
		add_class: function(el, class_name) {
			if (this.has_class(el, class_name)) {
				return false;
			}
			var classes = el.className ? el.className.split(/\s+/) : [];
			classes.push(class_name);
			el.className = classes.join(' ');
		},
		remove_node_with_its_contents: function(node) {
			var child = node.firstChild;
			while (child) {
				node.parentNode.insertBefore(child.cloneNode(true), node);
				child = child.nextSibling;
			}
			node.parentNode.removeChild(node);
		},
		get_parent_by_class_name: function(node, class_name) {
			while (node) {
				if (node.nodeName && util.has_class(node, class_name)) {
					return node;
				}
				node = node.parentNode;
			}
			return false;
		},
		get_parent_by_tag_name: function(node, tag_name) {
			tag_name = tag_name.toLowerCase();
			while (node) {
				if (node.nodeName && node.nodeName.toLowerCase() === tag_name) {
					return node;
				}
				node = node.parentNode;
			}
			return false;
		}
	};

	var ie_selection = function (win) {
		var self = this;
		this.win = win;
		this.doc = win.document;

		this.create_range = function() {
			this.r = this.doc.selection.createRange();
		};

		this.get_start = function () {
			this.create_range();
			if (this.r.item) {
				return this.r.item(0);
			}
			var r = this.r.duplicate();
			r.collapse(true);
			return r.parentElement();
			//return s && s.nodeName == 'BODY' ? s.firstChild : s;
		};

		this.insert_node = function (node) {
			this.create_range();
			this.r.collapse(false);
			var r = this.r.duplicate();
			var html;
			if (node.nodeType == 3) {
				html = n.nodeValue;
			} else {
				var fakeNode = this.doc.createElement('span');
				fakeNode.appendChild(node);
				html = fakeNode.innerHTML;
			}
			r.pasteHTML(html);
		};

		this.collapsed = function () {
			this.create_range();
			if (this.r.item) {
				return false;
			}
			return this.r.boundingWidth === 0;
		};

		this.wrap_with = function (tag_name, class_name) {
			this.create_range();
			var params = [];
			if (class_name) {
				if (typeof class_name === 'string') {
					class_name = {'class':class_name};
				}
				for (var i in class_name) {
					if (class_name.hasOwnProperty(i)) {
						params.push(i + '="' + class_name[i] + '"');
					}
				}
			}
			this.r.pasteHTML('<' + tag_name + ' ' + params.join(' ') + '>' + this.r.htmlText + '</' + tag_name + '>');
			this.r.select();
			return this.r.parentElement();
		};

		this.get_selection_as_node = function () {
			this.create_range();
			return this.r.htmlText;
		};

		this.save_selection = function() {
			this.create_range();
			if (this.r.item) {
				var n = this.r.item(0);
				this.r = this.doc.body.createTextRange();
				this.r.moveToElementText(n);
			}
			this.bookmark = this.r.getBookmark();
		};

		this.restore_selection = function() {
			if (this.bookmark) {
				this.win.focus();
				this.r.moveToBookmark(this.bookmark);
				this.r.select();
			}
		};

	};

	var normal_selection = function (win) {
		var self = this;
		this.win = win;
		this.doc = win.document;

		function get_selection() {
			return self.win.getSelection ? self.win.getSelection() : self.doc.selection;
		}

		function get_range() {
			var sel = get_selection();
			return sel.rangeCount > 0 ? sel.getRangeAt(0) : self.doc.createRange();
		}

		this.get_start = function () {
			return get_range().startContainer;
		};

		this.insert_node = function (node) {
			var r = get_range();
			r.insertNode(node);
			r.selectNodeContents(node);
			/*
			var s = get_selection();
			s.removeAllRanges();
			s.addRange(r);
			*/
		};

		this.wrap_with = function (tag_name, class_name) {
			var r = get_range();
			var new_parent = this.doc.createElement(tag_name);
			if (class_name) {
				if (typeof class_name == 'string') {
					new_parent.className = class_name;
				} else {
					for (var i in class_name) {
						if (class_name.hasOwnProperty(i)) {
							new_parent.setAttribute(i, class_name[i]);
						}
					}
				}
			}
			r.surroundContents(new_parent);
			return new_parent;
		};

		this.collapsed = function () {
			return get_range().collapsed;
		};

		this.get_selection_as_node = function () {
			var r = get_range();
			return r.extractContents();
		};
	};

	window.Wysiwyg = function(textarea) {
		var self = this;
		this.workspace = util.create_top('div', 'secure_wysiwyg_editor');

		var x = util.create_top('div', 'editor-top', this.workspace);
		var editor = util.create_top('div', 'editor', this.workspace);
		var btm = util.create_top('div', 'editor-bottom', this.workspace);
		btm.innerHTML = '<div class="editor-stretch"><a title="растянуть" href="#"><img alt="растянуть" src="images/stretch.gif"/></a></div>';
		btm.firstChild.onmousedown = function (e) {
			e = e || window.event;
			var ip = {};
			ip.y = e.clientY;
			ip.h = editor.offsetHeight;
			ip.eh = self.iframe.offsetHeight;
			document.onmousemove = function (e) {
				e = e || window.event;
				editor.style.height = ip.h + e.clientY - ip.y + 'px';
				self.iframe.style.height = ip.eh + e.clientY - ip.y + 'px';
			};
			document.onmouseup = function () {
				document.onmousemove = null;
				document.onmouseup = null;
			};
			return false;
		};
		
		// top controls (with logo)
		this.controls = util.create_top('div', 'btns-top', editor);
		util.create_top('div', 'editor-logo', this.controls);

		// hide and show
		var hideandshow_div = util.create_top('div', 'hideandshow', editor);
		var hideandshow_link = util.create_top('a', false, hideandshow_div);
		hideandshow_link.href = "#";
		hideandshow_link.innerHTML = '<img title="" alt="" src="images/hide.gif" />';
		hideandshow_link.onclick = function () {
			var s = self.controls.style;
			s.display = s.display ? '' : 'none';
			// todo: resize textarea/iframe
			return false;
		};

		// btns-left
		var left_btns = util.create_top('div', 'btns-left', editor);
		this.btns_big = util.create_top('div', 'btns-big', left_btns);
		this.btns_small = util.create_top('div', 'btns-small', left_btns);

		// textplace
		var textplace = util.create_top('div', 'textplace', editor);
		util.create_top('div', 'clear', editor);

		// editor area
		util.create_top('div', 'textarea-top', textplace);
		var editor_keeper = util.create_top('div', 'textborder', textplace);
		util.create_top('div', 'textarea-bottom', textplace);

		// visual and text editors
		this.source = util.create_top('textarea', 'textarea', editor_keeper);
		this.iframe = util.create_top('iframe', 'textarea', editor_keeper);
		this.iframe.setAttribute('frameborder', 0);
		this.is_msie = $.browser.msie;

		util.wysiwyg = this;

		textarea.parentNode.insertBefore(this.workspace, textarea.nextSibling);

		var styles = {
			source: {
				display: 'none'
			},
			iframe: {
				border: '0'
			}
		};

		for (var i in styles) {
			if (styles.hasOwnProperty(i)) {
				util.set_style(this[i], styles[i]);
			}
		}

		this.source.value = textarea.value;
		this.source.setAttribute('name', textarea.name);
		textarea.parentNode.removeChild(textarea);
		this.win = this.iframe.contentWindow;
		this.doc = this.iframe.contentWindow.document;
		var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><link rel="stylesheet" type="text/css" href="common.css" /></head><body class="wysiwyg-mode">' + this.source.value + '</body></html>';
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

		var cbs = this.is_msie ? ie_selection : normal_selection;
		this.selection = new cbs(this.win);

		this.win.focus();

		$(this.doc)
		.keydown(function(e) {
			if ($.browser.safari && e.keyCode == 13) {
				if (e.shiftKey || !self.dom.parent(self.selection.getNode(), /^(P|LI)$/)) {
					self.selection.insertNode(self.doc.createElement('br'))
					return false;
				}
			}
		})
		.bind('keypress', function(e) {
			if ($.browser.opera && e.keyCode == 13) {
				if (util.get_parent_by_class_name(self.selection.getStart(), 'spoiler')) {
					self.selection.insertNode(self.doc.createElement('br'));
					return false;
				}
			}
		})
		.bind('keyup mouseup', function(e) {
			if (e.type == 'mouseup' || e.ctrlKey || e.metaKey || (e.keyCode >= 8 && e.keyCode <= 13) || (e.keyCode>=32 && e.keyCode<= 40) || e.keyCode == 46 || (e.keyCode >=96 && e.keyCode <= 111)) {
				self.update_controls();
			}
		});

		this.init_controls();
	};

	window.Wysiwyg.prototype = {
		update_controls: function () {
			var node = this.selection.get_start();
			var cur = node;
			var parents = [];
			var parent_classes = [];
			var selection_collapsed = this.selection.collapsed();
			while (cur && cur.nodeName) {
				parents.push(cur.nodeName);
				var cls = cur.getAttribute && cur.getAttribute('class');
				if (cls) {
					parent_classes.push(cls);
				}
				cur = cur.parentNode;
			}

			var source_mode = this.mode === 'text';
			for (var i in this.buttons) {
				var b = this.buttons[i], bel = b.el.parentNode;
				if (source_mode) {
					if (b.name === 'show_source') {
						util.remove_class(b.el, 'disabled');
					} else {
						util.add_class(b.el, 'disabled');
					}
					util.remove_class(b.el, 'click');
					continue;
				}
				switch (b.name) {
				case 'code':
					if (util.in_array('bb-code', parent_classes) !== -1) {
						util.add_class(bel, 'click');
					} else {
						util.remove_class(bel, 'click');
					}
					break;
				case 'insertimage':
					if (node && node.nodeName === 'IMG') {
						util.add_class(bel, 'click');
					} else {
						util.remove_class(bel, 'click');
					}
					util.remove_class(bel, 'disabled');
					break;
				case 'spoiler':
					if (util.in_array('spoiler', parent_classes) !== -1) {
						util.add_class(bel, 'click');
					} else {
						util.remove_class(bel, 'click');
					}
					util.remove_class(bel, 'disabled');
					break;
				case 'setcolor':
				case 'show_source':
				case 'hide':
				case 'media':
				case 'smile':
					util.remove_class(bel, 'disabled');
				break;
				case 'createlink':
					if (util.in_array('A', parents) !== -1) {
						util.add_class(bel, 'click');
						util.remove_class(bel, 'disabled');
					} else {
						util.remove_class(bel, 'click');
						if (selection_collapsed) {
							util.add_class(bel, 'disabled');
						} else {
							util.remove_class(bel, 'disabled');
						}
					}
				break;
				case 'quote':
					if (util.in_array('BLOCKQUOTE', parents) !== -1) {
						util.add_class(bel, 'click');
					} else {
						util.remove_class(bel, 'click');
					}
					util.remove_class(bel, 'disabled');
					break;
				default:
					try {
						if (!this.doc.queryCommandEnabled(b.name)) {
							util.add_class(bel, 'disabled');
						} else {
							util.remove_class(bel, 'disabled');
						}
					} catch (e) {
						continue;
					}
					try {
						if (this.doc.queryCommandState(b.name)) {
							util.add_class(bel, 'click');
						} else {
							util.remove_class(bel, 'click');
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
				image: 'bb-bold',
				action: 'bold'
			},
			'|',
			{
				image: 'bb-italic',
				action: 'italic'
			},
			'|',
			{
				image: 'bb-underline',
				action: 'underline'
			},
			'|',
			/* {
				image: 'text_superscript',
				action: 'superscript'
			}, */
			/* {
				image: 'text_subscript',
				action: 'subscript'
			}, */
			{
				image: 'bb-textjustify',
				action: 'justifyfull'
			},
			'|',
			{
				image: 'bb-textleft',
				action: 'justifyleft'
			},
			'|',
			{
				image: 'bb-textright',
				action: 'justifyright'
			},
			'|',
			{
				image: 'bb-textcenter',
				action: 'justifycenter'
			},
			'|',
			{
				image: 'bb-nonumberlist',
				action: 'insertunorderedlist'
			},
			'|'/* ,
			{
				image: 'text_list_numbers',
				action: 'insertorderedlist'
			}
			 */
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
				image: 'bb-color',
				command: 'setcolor',
				action: function () {
					w.show_colorpicker(function (color) {
						if (w.selection.collapsed()) {
							var colored_span = util.create('span');
							colored_span.setAttribute('style', 'color:' + color);
							w.selection.insert_node(colored_span);
							w.win.focus();
						} else {
							w.selection.wrap_with('span', {'style':'color:' + color});
						}
					});
				}
			});
			commands.push('|');

			// show source code
			commands.push({
				image: 'page_code',
				command: 'show_source',
				action: function () {
					w.switch_design_mode();
				}
			});

			//////////////////////////////////////////////////////

			/// image
			commands.push({
				image: 'bb-file',
				command: 'insertimage',
				action: function () {
					var properties;
					var selStart = w.selection.get_start();
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
						w.selection.insert_node(properties.link ? link : image);
						w.win.focus();
					}, properties);
				},
				label: '+ Файл',
				panel: 'btns_big'
			});

			/// link
			commands.push({
				image: 'bb-link',
				command: 'createlink',
				action: function () {
					var linkNode = util.get_parent_by_tag_name(w.selection.get_start(), 'a');
					w.show_linkcreator(linkNode, function (link) {
						//w.doc.execCommand('createlink', false, link);
						if (linkNode) {
							linkNode.setAttribute('href', link);
						} else {
							w.selection.wrap_with('a', {'href':link});
							w.win.focus();
						}
					});
				},
				label: 'Ссылка',
				panel: 'btns_big'
			});

			//////////////////////////////////////////////////////

			/// quote
			commands.push({
				image: 'bb-quote',
				command: 'quote',
				action: function () {
					var quote = util.get_parent_by_tag_name(w.selection.get_start(), 'blockquote');
					if (quote) {
						util.remove_node_with_its_contents(quote);
						//w.selection.cleanCache();
					} else {
						if (w.selection.collapsed()) {
							quote = w.doc.createElement('blockquote');
							quote.innerHTML = '<br />';
							w.selection.insert_node(quote);
						} else {
							w.selection.wrap_with('blockquote');
						}
					}
					w.win.focus();

				},
				panel: 'btns_small'
			});

			/// spoiler
			commands.push({
				image: 'bb-spoiler',
				command: 'spoiler',
				action: function () {
					var node = w.selection.get_start();
					var spoiler = util.get_parent_by_class_name(node, 'spoiler');
					if (!spoiler) {
						spoiler = util.create('div', 'spoiler');

						var toggler = util.create('div', 'toggler', spoiler);
						toggler.innerHTML = 'click to toggle spoiler';
						toggler.setAttribute('onclick', 'var s = this.nextSibling.style; s.display = s.display ? \'none\' : \'\'; return false; ');

						var hidden_text = util.create('div', 'hidden_text', spoiler);

						if (w.selection.collapsed()) {
							hidden_text.innerHTML = '<br/>';
						} else {
							if (w.is_msie) {
								hidden_text.innerHTML = w.selection.get_html();
							} else {
								hidden_text.appendChild(w.selection.get_selection_as_node());
							}
						}

						w.selection.insert_node(spoiler);
					} else {
						spoiler.removeChild(spoiler.firstChild);
						util.remove_node_with_its_contents(spoiler.lastChild);
						util.remove_node_with_its_contents(spoiler);
					}
					w.win.focus();
				},
				panel: 'btns_small'
			});

			/// hide
			commands.push({
				image: 'bb-hide',
				command: 'hide',
				action: function () {
					var hide = util.get_parent_by_class_name(w.selection.get_start(), 'bb-hide');
					w.show_hidecreator(hide, function (value) {
						if (hide) {
							if (value) {
								hide.setAttribute('value', value);
							} else {
								util.remove_node_with_its_contents(hide);
							}
							return;
						}
						if (w.selection.collapsed()) {
							var code = util.create('div', 'bb-hide');
							code.setAttribute('value', value);
							code.innerHTML = '<span>&nbsp;</span><br/>';
							w.selection.insert_node(code);
						} else {
							w.selection.wrap_with('div', {
								'value': value,
								'class': 'bb-hide'
							});
						}
					});
					w.win.focus();
				},
				panel: 'btns_small'
			});

			/// code
			commands.push({
				image: 'bb-code',
				command: 'code',
				action: function () {
					var code = util.get_parent_by_class_name(w.selection.get_start(), 'bb-code');
					if (code) {
						util.remove_node_with_its_contents(code);
					} else {
						if (w.selection.collapsed()) {
							code = util.create('pre', 'bb-code');
							code.innerHTML = '<br/>';
							w.selection.insert_node(code);
						} else {
							w.selection.wrap_with('pre', 'bb-code');
						}
					}
				},
				panel: 'btns_small'
			});

			// smile
			commands.push({
				image: 'bb-smile',
				command: 'smile',
				action: function () {
					alert('Not implemented yet. Sorry.');
				},
				panel: 'btns_small'
			});

			/// media
			// todo: bookmark range for msie
			commands.push({
				image: 'bb-media',
				command: 'media',
				action: function () {
					var media = util.get_parent_by_class_name(w.selection.get_start(), 'bb-media');
					if (media) {
						media.parentNode.removeChild(media);
					} else {
						w.show_media_dialog(function(html){
							media = util.create('div', 'bb-media');
							media.innerHTML = html;
							w.selection.insert_node(media);
						});
					}
				},
				panel: 'btns_small'
			});

			/// undo
			commands.push({
				image: 'bb-prev',
				action: 'undo',
				panel: 'btns_small'
			});

			/// redo
			commands.push({
				image: 'bb-next',
				action: 'redo',
				panel: 'btns_small'
			});

			var ul = util.create_top('ul');
			var ul_left_big = util.create_top('ul');
			var ul_left_small = util.create_top('ul');
			for (var i = 0, len = commands.length; i < len; i++) {

				var cmd = commands[i];

				if (cmd === '|') {
					util.create_top('li', 'editor-separator', ul);
					continue;
				}

				var button_holder = util.create_top('li');
				var button = util.create_top('a', false, button_holder);
				var image = util.create_top('img', false, button);
				image.src = 'images/' + cmd.image + '.gif';
				button.href = '#';

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

				switch (cmd.panel) {
				case 'btns_big':
					/* var label = util.create_top('span');
					label.innerHTML = ' ' + cmd.label;
					button.appendChild(label); */
					ul_left_big.appendChild(button_holder);
					break;
				case 'btns_small':
					ul_left_small.appendChild(button_holder);
					break;
				default:
					ul.appendChild(button_holder);
				}

				w.buttons.push({
					name: cmd.command || cmd.action,
					el: button
				});
			}
			w.controls.appendChild(ul);
			w.btns_big.appendChild(ul_left_big);
			w.btns_small.appendChild(ul_left_small);
		},
		show_colorpicker: function (callback) {
			var div = document.createElement('div');
			var html = '<ul class="colorpicker">';
			var colors = '0369CF'.split('');
			for (var r = 0; r < 6; r += 1) {
				for (var g = 0; g < 6; g += 1) {
					for (var b = 0; b < 6; b += 1) {
						var c = colors[r] + colors[g] + colors[b];
						html += '<li style="background-color:#' + c + '">&nbsp;</li>';
					}
				}
				html += '</ul><ul class="colorpicker">';
			}
			html += '</ul>';
			div.innerHTML = html;
			var selected_color;
			div.onclick = function (e) {
				e = e || window.event;
				var t = e.target || e.srcElement;
				/* var h = '';
				for (var i in e) h += i + '=' + e[i] + ',';
				alert(h); */
				if (t && t.nodeName === 'LI') {
					selected_color = t.style.backgroundColor;
				}
			};
			this.show_modal_dialog({caption: 'Выбор цвета'}, div, function (div) {
				callback(selected_color);
			});
		},
		show_linkcreator: function (linkNode, callback) {
			var div = document.createElement('div');
			div.innerHTML = '<form><div class="modal-type">Адрес ссылки:</div>' +
				'<input type="text" name="url" class="modal-text" value="' + (linkNode ? linkNode.getAttribute('href') : '') + '" />' +
				'</form>';
			this.show_modal_dialog({caption: 'Вставка ссылки'}, div, function (div) {
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
			this.show_modal_dialog({caption: 'Вставка изображения'}, div, function (div) {
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
		show_media_dialog: function (callback) {
			var div = document.createElement('div');
			div.innerHTML = '<form><div class="modal-type">Код видео:</div>' +
				'<textarea name="code"></textarea>' +
			'</form>';
			this.show_modal_dialog({caption: 'Вставка медиа'}, div, function (div) {
				callback(div.firstChild.code.value);
			});
		},
		show_hidecreator: function (hideNode, callback) {
			var div = document.createElement('div');
			div.innerHTML = '<form><div class="modal-type">Количество сообщений:</div>' +
			'<input name="count" class="modal-text" value="' + (hideNode ? hideNode.getAttribute('value') : '') + '" />' +
			'</form>';
			this.show_modal_dialog({caption: 'Вставка скрытого контента'}, div, function (div) {
				var v = parseInt(div.firstChild.count.value, 10);
				if (isNaN(v)) {
					div.firstChild.count.focus();
					error = util.create_top('div');
					error.style.color = 'red';
					error.style.marginLeft = '103px';
					error.style.padding = '5px';
					error.innerHTML = 'Введите число';
					div.firstChild.appendChild(error);
					return false;
				}
				callback(v);
			});
		},
		switch_design_mode: function () {
			var iframe = this.iframe;

			if (!this.mode || this.mode === 'design') {
				iframe.style.display = 'none';
				this.source.style.display = '';
				this.source.value = this.doc.body.innerHTML;
				this.mode = 'text';
			} else {
				iframe.style.display = '';
				this.source.style.display = 'none';
				this.doc.body.innerHTML = this.source.value;
				try {
					//iframe.contentWindow.document.execCommand("useCSS", false, true);
				} catch (e) {

				}
				//this.export_textarea();
				this.mode = 'design';
			}
		},
		show_modal_dialog: function(options, contents_div, callback) {
			var self = this;
			self.selection.save_selection && self.selection.save_selection();
			var overlay = document.createElement('div');
			overlay.id = 'overlay';
			document.body.appendChild(overlay);

			var dialog_wrapper = document.createElement('div');
			util.add_class(dialog_wrapper, 'modalwindow');
			overlay.appendChild(dialog_wrapper);

			// round corners
			var corners = ['mtl', 'mtr', 'mbl', 'mbr'];
			for (var i = 0; i < 4; i++ ) {
				var corner = document.createElement('div');
				util.add_class(corner, corners[i]);
				dialog_wrapper.appendChild(corner);
			}

			var dialog = document.createElement('div');
			util.add_class(dialog, 'modalmain');
			dialog_wrapper.appendChild(dialog);

			var header = document.createElement('div');
			header.innerHTML = options.caption;
			util.add_class(header, 'modaltitle');
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
			util.add_class(descr_div, 'modaldescr');

			dialog.appendChild(descr_div);
			descr_div.appendChild(contents_div);

			var footer = document.createElement('div');
			util.add_class(footer, 'modalclose');
			dialog.appendChild(footer);

			var btn_ok = document.createElement('button');
			btn_ok.innerHTML = 'OK';
			footer.appendChild(btn_ok);
			btn_ok.onclick = function () {
				self.selection.restore_selection && self.selection.restore_selection();
				var r = callback(contents_div);
				if (r === false) {
					return false;
				}
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
	};

})(jQuery);
