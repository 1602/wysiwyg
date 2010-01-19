function Wysiwyg(textarea, options) {
	options = options || {};
	options.min_width = options.min_width || 674;
	options.max_width = options.max_width || 800;
	options.min_height = options.min_height || 315;
	options.max_height = options.max_height || 600;

	this.$ = new Util(this);

	var self = this,
		$ = this.$;

	this.workspace = $.create_top('div', 'secure_wysiwyg_editor');

	var x = $.create_top('div', 'editor-top', this.workspace);
	var editor = $.create_top('div', 'editor', this.workspace);
	var btm = $.create_top('div', 'editor-bottom', this.workspace);
	btm.innerHTML = '<div class="editor-stretch"><a title="растянуть" href="#"><img alt="растянуть" src="images/stretch.gif"/></a></div>';
	btm.firstChild.onmousedown = function (e) {
		e = e || window.event;
		var ip = {};
		ip.y = e.clientY;
		ip.x = e.clientX;
		ip.h = editor.offsetHeight;
		ip.w = editor.offsetWidth;
		ip.eh = self.iframe.offsetHeight;
		ip.ew = self.iframe.offsetWidth;
		ip.th = self.tp.offsetHeight;
		ip.tw = self.tp.offsetWidth;
		document.onmousemove = function (e) {
			e = e || window.event;
			var h = ip.h + e.clientY - ip.y;
			var w = ip.w + e.clientX - ip.x;
			if (options.min_width <= w && w <= options.max_width) {
				editor.style.width = w + 'px';
				self.iframe.style.width = ip.ew + e.clientX - ip.x + 'px';
				self.tp.style.width = ip.tw + e.clientX - ip.x + 'px';
			}
			if (options.min_height <= h && h <= options.max_height) {
				editor.style.height = h + 'px';
				self.iframe.style.height = ip.eh + e.clientY - ip.y + 'px';
				self.tp.style.height = ip.th + e.clientY - ip.y + 'px';
			}
		};
		document.onmouseup = function () {
			document.onmousemove = null;
			document.onmouseup = null;
		};
		return false;
	};

	// top controls (with logo)
	this.controls = $.create_top('div', 'btns-top', editor);
	$.create_top('div', 'editor-logo', this.controls);

	// hide and show
	var hideandshow_div = $.create_top('div', 'hideandshow', editor);
	var hideandshow_link = $.create_top('a', false, hideandshow_div);
	hideandshow_link.href = "#";
	hideandshow_link.innerHTML = '<img title="" alt="" src="images/hide.gif" style="display: none;" /><img title="" alt="" src="images/show.gif" />';
	hideandshow_link.onclick = function () {
		var s = [
			self.controls.style,
			hideandshow_link.firstChild.style,
			hideandshow_link.lastChild.style
		];
		for (var i = 0; i < s.length; i++) {
			s[i].display = s[i].display ? '' : 'none';
		}

		// todo: resize textarea/iframe
		return false;
	};

	// btns-left
	var left_btns = $.create_top('div', 'btns-left', editor);
	this.btns_big = $.create_top('div', 'btns-big', left_btns);
	this.btns_small = $.create_top('div', 'btns-small', left_btns);

	// textplace
	var textplace = $.create_top('div', 'textplace', editor);
	this.tp = textplace;
	$.create_top('div', 'clear', editor);

	// editor area
	$.create_top('div', 'textarea-top', textplace);
	var editor_keeper = $.create_top('div', 'textborder', textplace);
	$.create_top('div', 'textarea-bottom', textplace);

	// visual and text editors
	this.source = $.create_top('textarea', 'textarea', editor_keeper);
	this.iframe = $.create_top('iframe', 'textarea', editor_keeper);
	this.iframe.setAttribute('frameBorder', 0);
	this.is_msie = $.browser.msie;

	textarea.parentNode.insertBefore(this.workspace, textarea.nextSibling);

	var styles = {
		source: {
			display: 'none'
		},
		iframe: {
			border: '0'
		}
	};

	$.each(styles, function (i, style) {
		$.set_style(self[i], style);
	});

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
		try {
			this.doc.designMode = "on";
		} catch (e) {
		}
		this.doc.execCommand('styleWithCSS', false, false);
	}

	this.selection = $.selection();

	this.win.focus();

	$.add_event(this.doc, 'keydown', function (e) {
		/* if ($.browser.safari && e.keyCode === 13) {
			if (e.shiftKey || !self.dom.parent(self.selection.getNode(), /^(P|LI)$/)) {
				self.selection.insert_node(self.doc.createElement('br'));
				return false;
			}
		} */
		if ($.browser.opera && e.keyCode === 13) {
			if (self.selection.filter('.spoiler')) {
				self.selection.insert_node($.create('br'));
				return false;
			}
		}
	});

	$.add_event(this.doc, 'keyup mouseup', function (e) {
		if (e.type == 'mouseup' || e.ctrlKey || e.metaKey || (e.keyCode >= 8 && e.keyCode <= 13) || (e.keyCode>=32 && e.keyCode<= 40) || e.keyCode == 46 || (e.keyCode >=96 && e.keyCode <= 111)) {
			self.update_controls();
		}
	});

	this.init_controls();
	this.win.focus();
	this.update_controls();
};

Wysiwyg.prototype = {
	plugins: {},
	update_controls: function () {
		var self = this,
			node = this.selection.get_start(),
			cur = node,
			regex_tagname = /^\<(.*?)\>$/,
			regex_classname = /^\.(.*)$/;
		var state = {
			parents: [],
			parent_classes: [],
			selection_collapsed: this.selection.collapsed()
		}
		while (cur && cur.nodeName) {
			state.parents.push(cur.nodeName);
			var cls = cur.getAttribute && cur.getAttribute('class');
			if (cls) {
				state.parent_classes.push(cls);
			}
			cur = cur.parentNode;
		}

		var source_mode = this.mode === 'text';
		for (var i in this.initialized_plugins) {
			var p = this.initialized_plugins[i], bel = p.el && p.el.parentNode;
			if (!bel) continue;
			if (source_mode) {
				if (p.command === 'show_source') {
					self.$.remove_class(bel, 'disabled');
				} else {
					self.$.add_class(bel, 'disabled');
				}
				self.$.remove_class(bel, 'click');
				continue;
			}
			if (typeof p.update === 'function') {
				p.update(bel, state);
			} else if (typeof p.update === 'string') {
				self.$.remove_class(bel, 'disabled');
				var matched_tagname = false, matched_classname = false;
				if ((matched_tagname = p.update.match(regex_tagname)) &&
					self.$.in_array(matched_tagname[1], state.parents) !== -1 ||
					(matched_classname = p.update.match(regex_classname)) &&
					self.$.in_array(matched_classname[1], state.parent_classes) !== -1
				) {
					self.$.add_class(bel, 'click');
				} else {
					self.$.remove_class(bel, 'click');
				}
			}
		}
	},
	init_controls: function () {
		var w = this, editor = w.doc, body = editor.body;

		w.initialized_plugins = [];

		function init(block, plugin) {
			if (plugin === '|') {
				w.$.create_top('li', 'editor-separator', block);
				return;
			}

			if (!w.plugins[plugin]) {
				return;
			}

			var p = new w.plugins[plugin](w);

			var button_holder = w.$.create_top('li', p.className || false, block);
			if (p.html) {
				button_holder.innerHTML = p.html;
				p.init && p.init(button_holder);
			} else {
				var button = w.$.create_top('a', false, button_holder);
				var image = w.$.create_top('img', false, button);
				image.src = 'images/' + p.image + '.gif';
				button.href = '#';
				p.el = button;

				button.onclick = function (e) {
					if (w.$.has_class(button_holder, 'disabled')) {
						return false;
					}
					if (typeof p.action === 'function') {
						p.action();
						w.update_controls();
					} else {
						w.win.focus();
						w.doc.execCommand(p.action, false, false);
						w.update_controls();
						w.win.focus();
					}

					return false;
				};
			}
			w.initialized_plugins.push(p);
		}

		w.$.each([
			{
				block: w.$.create_top('ul', false, w.controls),
				buttons: ['bold', '|', 'italic', '|', 'underline', '|', 'fontsize', '|', 'justifyfull', '|', 'justifyleft', '|', 'justifyright', '|', 'justifycenter', '|', 'insertunorderedlist', '|', 'setcolor', '|', 'mode_switcher']
			},
			{
				block: w.$.create_top('ul', false, w.btns_big),
				buttons: ['image_and_file', 'link']
			},
			{
				block: w.$.create_top('ul', false, w.btns_small),
				buttons: ['quote', 'spoiler', 'hide', 'code', 'smile', 'media', 'undo', 'redo']
			}
		], function (i, panel) {
			w.$.each(panel.buttons, function (i, name) {
				init(panel.block, name);
			});
		});

	},
	switch_design_mode: function () {
		var self = this;
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
			this.mode = 'design';
		}
	},
	show_modal_dialog: function(options, contents_div, callback) {
		var self = this;
		var $ = this.$;
		self.selection.save_selection && self.selection.save_selection();
		var overlay = document.createElement('div');
		overlay.id = 'overlay';

		document.body.appendChild(overlay);

		var dialog_wrapper = document.createElement('div');
		self.$.add_class(dialog_wrapper, 'modalwindow');
		dialog_wrapper.style.zIndex = 1002;
		if (options.width) {
			dialog_wrapper.style.width = options.width + 'px';
		}
		if (options.height) {
			dialog_wrapper.style.height = options.height + 'px';
		}
		overlay.appendChild(dialog_wrapper);

		// round corners
		var corners = ['mtl', 'mtr', 'mbl', 'mbr'];
		for (var i = 0; i < 4; i++ ) {
			var corner = document.createElement('div');
			self.$.add_class(corner, corners[i]);
			dialog_wrapper.appendChild(corner);
		}

		var dialog = document.createElement('div');
		$.add_class(dialog, 'modalmain');
		dialog_wrapper.appendChild(dialog);

		var header = document.createElement('div');
		header.innerHTML = options.caption;
		$.add_class(header, 'modaltitle');
		dialog.appendChild(header);

		// make header draggable
		var init_pos = {x: 0, y: 0, t: 0, l: 0};
		header.onmousedown = function (e) {
			e = e || window.event;
			init_pos.x = e.clientX;
			init_pos.y = e.clientY;
			init_pos.t = dialog_wrapper.offsetTop;
			init_pos.l = dialog_wrapper.offsetLeft;
			init_pos.bounds = self.$.calc_drag_bounds(dialog_wrapper);
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
		$.add_class(descr_div, 'modaldescr');

		dialog.appendChild(descr_div);
		descr_div.appendChild(contents_div);

		var footer = document.createElement('div');
		$.add_class(footer, 'modalclose');
		dialog.appendChild(footer);

		var btn_cancel = $.create_top('button');
		btn_cancel.innerHTML = 'Cancel';
		btn_cancel.onclick = function () {
			overlay.parentNode.removeChild(overlay);
		}

		var btn_ok = $.create_top('button');
		btn_ok.innerHTML = 'OK';
		btn_ok.onclick = function () {
			self.selection.restore_selection && self.selection.restore_selection();
			var r = callback(contents_div);
			if (r === false) {
				return false;
			}
			overlay.parentNode.removeChild(overlay);
		}

		footer.appendChild(btn_ok);
		footer.appendChild(btn_cancel);

		dialog_wrapper.style.left = Math.round((overlay.offsetWidth - dialog_wrapper.offsetWidth) / 2) + 'px';
		dialog_wrapper.style.top = Math.round((overlay.offsetHeight - dialog_wrapper.offsetHeight) / 2) + 'px';

		overlay.style.visibility = 'visible';

		return {ok: btn_ok, cancel: btn_cancel};
	}
};
