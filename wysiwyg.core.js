/*global Util */

function Wysiwyg(textarea, options) {
	options = options || {};
	options.admin_mode = options.admin_mode || false;
	options.min_width = options.min_width || 674;
	options.max_width = options.max_width || 1024;
	options.min_height = options.min_height || 315;
	options.max_height = options.max_height || 768;
	options.show_media_panel = options.show_media_panel || true;
	options.css_path = options.css_path || 'common.css';

	this.options = options;

	this.$ = new Util(this);

	var self = this,
		$ = this.$;

	this.workspace_wrapper = $.create_top('div', 'secure_wysiwyg_editor');
	this.workspace_wrapper.style.padding = '10px';
	this.workspace_wrapper.style.background = '#fff';
	this.workspace = $.create_top('div', 'secure_wysiwyg_editor', this.workspace_wrapper);
	this.workspace.style.padding = '20px';

	function resizer(el) {
		self.resizer = el;
		el.onmousedown = function (e) {
			e = e || window.event;
			var ip = {};
			ip.y = e.clientY;
			ip.x = e.clientX;
			ip.h = editor.offsetHeight - 20;
			ip.w = editor.offsetWidth;
			ip.eh = self.iframe.offsetHeight - 20;
			ip.ew = self.iframe.offsetWidth - 20;
			ip.th = self.tp.offsetHeight;
			ip.tw = self.tp.offsetWidth;
			ip.cw = self.controls.offsetWidth;

			var overlay = $.create_top('div', null, document.body);
			$.set_style(overlay, {
				position: 'absolute',
				left: 0,
				top: 0,
				width: '100%',
				height: '100%',
				zIndex: 1000
			});

			function update_size(e) {
				var dx = (e.clientX - ip.x) * 2;
				var dy = e.clientY - ip.y;
				var h = ip.h + dy;
				var w = ip.w + dx;
				if (options.min_width <= w && w <= options.max_width) {
					editor.style.width = w + 'px';
					self.adjust_editor_area_size();
					//self.iframe.style.width = ip.ew + dx + 'px';
					//self.tp.style.width = ip.tw + dx + 'px';
					//self.controls.style.width = ip.cw + e.clientX - ip.x + 'px';
				}
				if (options.min_height <= h && h <= options.max_height) {
					editor.style.height = h + 'px';
					self.adjust_editor_area_size();
					//self.iframe.style.height = ip.eh + dy + 'px';
					//self.tp.style.height = ip.th + dy + 'px';
				}
			}

			document.onmousemove = function (e) {
				e = e || window.event;
				update_size(e);
				return false;
			};

			document.onmouseup = function () {
				document.onmousemove = null;
				document.onmouseup = null;
				document.body.removeChild(overlay);
			};
			return false;
		};

	}

	//var x = $.create_top('div', 'editor-top', this.workspace);
	var editor = $.create_top('div', 'editor', this.workspace);
	// min width of editor should be updated after top-buttons-panel initialization
	editor.style.width = this.options.min_width + 'px';

	// top-level corners
	$.each(['etl', 'etr', 'ebl', 'ebr'], function (i, class_name) {
		$.create_top('div', class_name, editor);
	});

	// stretch (resizer)
	var editor_stretch = $.create_top('div', 'editor-stretch', editor);
	editor_stretch.innerHTML = '<a title="растянуть" href="#"><div class="bb-stretch"></div></a>';
	resizer(editor_stretch);

	// top controls (with logo and rounded corners)
	this.controls = $.create_top('div', 'btns-top', editor);
	$.each(['editor-logo', 'ettl', 'ettr', 'etbl', 'etbr'], function (i, class_name) {
		$.create_top('div', class_name, self.controls);
	});

	// hide and show
	var hideandshow_div = $.create_top('div', 'hideandshow', editor);
	var hideandshow_link = $.create_top('a', false, hideandshow_div);
	hideandshow_link.href = "#";
	hideandshow_link.innerHTML = '<span title="show" style="display: none;" class="bb-btn-hide"></span><span title="hide" class="bb-btn-show"></span>';
	//<img title="" alt="show" src="images/hide.gif" style="display: none;" /><img title="" alt="hide" src="images/show.gif" />
	hideandshow_link.onclick = function () {
		$.each([
			self.controls.style,
			hideandshow_link.firstChild.style,
			hideandshow_link.lastChild.style
		], function (i, s) {
			s.display = s.display ? '' : 'none';
		});
		self.adjust_editor_area_size();
		return false;
	};

	// btns-left
	if (options.show_media_panel) {
		var left_btns = $.create_top('div', 'btns-left', editor);
		this.btns_big = $.create_top('div', 'btns-big', left_btns);
		this.btns_small = $.create_top('div', 'btns-small', left_btns);
	}

	// textplace
	var textplace = $.create_top('div', 'textplace', editor);
	this.tp = textplace;
	$.create_top('div', 'clear', editor);

	// editor area
	var editor_keeper = $.create_top('div', 'textborder', textplace);

	// editor-level corners
	$.each(['eetl', 'eetr', 'eebl', 'eebr'], function (i, class_name) {
		$.create_top('div', class_name, editor_keeper);
	});

	// visual and text editors
	this.source = $.create_top('textarea', 'textarea', editor_keeper);
	this.iframe = $.create_top('iframe', 'textarea', editor_keeper);
	this.iframe.setAttribute('frameBorder', 0);
	this.is_msie = $.browser.msie;

	textarea.parentNode.insertBefore(this.workspace_wrapper, textarea.nextSibling);

	var styles = {
		iframe: {
			zIndex: 1,
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
	var css_path = options.css_path;
	var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><link rel="stylesheet" type="text/css" href="' + css_path + '" /></head><body class="wysiwyg-mode">' + this.source.value + '</body></html>';
	this.doc.open();
	this.doc.write(html);
	this.doc.close();
	//this.doc.onpaste = function () { alert('paste detected')};
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
	this.locale = new $.localization('ru_RU');

	this.win.focus();

	// shift+enter for msie
	if ($.browser.msie) {
		this.doc.onkeydown = function () {
			if (self.win.event.keyCode === 13 && self.selection.filter('.spoiler')) {
				self.selection.insert_node(self.doc.createElement('br'));
				return false;
			}
			self.text_modified();
		};
	}

	// shift+enter for opera
	$.add_event(this.doc, 'keydown', function (e) {
		/* if ($.browser.safari && e.keyCode === 13) {
			if (e.shiftKey || !self.dom.parent(self.selection.getNode(), /^(P|LI)$/)) {
				self.selection.insert_node(self.doc.createElement('br'));
				return false;
			}
		} */
		if (($.browser.opera) && e.keyCode === 13) {
			if (self.selection.filter('.spoiler')) {
				self.selection.insert_node($.create('br'));
				return false;
			}
		}
		self.text_modified();
	});

	// hook onpaste event for ie
	if ($.browser.msie || $.browser.opera) {
		// listen for ctrl+v
		$.add_event(this.doc, 'keydown', function (e) {
			if (e.ctrlKey && e.keyCode == 86) {
				self.clean_html();
			}
		});
		// disable rightclick
		$.add_event(this.doc, 'mousedown', function (e) {
			e = e || self.win.event;
			if (e.button == 2 || e.button == 3) {
				if ($.browser.opera) {
					alert('Опция отключена для браузера Opera. Для вставки текста используйте ctrl+v');
				}
				return false;
			}
		});
		$.add_event(this.doc, 'contextmenu', function () {
			return false;
		});
	// hook onpaste event for normal browsers (webkit, ff)
	} else {
		$.add_event(this.doc, 'paste', function () {
			setTimeout(function () {
				self.clean_html();
			}, 100);
		});
	}
	
	$.add_event(this.doc, 'keyup mouseup', function (e) {
		if (e.type === 'mouseup' || e.ctrlKey || e.metaKey ||
			(e.keyCode >= 8 && e.keyCode <= 13) ||
			(e.keyCode >= 32 && e.keyCode <= 40) || e.keyCode === 46 ||
			(e.keyCode >= 96 && e.keyCode <= 111)) {
			self.update_controls();
		}
		self.text_modified();
	});

	/*
	$.add_event(this.doc, 'mousedown', function (e) {
		e = e || self.doc.event;
		var t = e.srcElement || e.target;
		if (t.style.position !== 'absolute') {
			t.style.position = 'absolute';
		}
		t._moz_resizing = false;
		var ip = {};
		ip.y = e.clientY;
		ip.x = e.clientX;
		var move = function (e) {
			e = e || self.doc.event;
			t.style.top = e.clientY - ip.y + 'px';
			t.style.left = e.clientX - ip.x + 'px';
		};
		var up = function (e) {
			$.remove_event(self.doc, 'mousemove', move);
			$.remove_event(self.doc, 'mousemove', up);
		};
		$.add_event(self.doc, 'mousemove', move);
		$.add_event(self.doc, 'mouseup', up);
		return false;
	});
	*/

	this.init_controls();
	this.clean_html();
	this.win.focus();
	this.update_controls();

	// adjust min height
	var top_panel_ul = this.controls.lastChild;
	var li = top_panel_ul.firstChild;
	var ul_width = 0;
	while (li) {
		ul_width += li.offsetWidth;
		if (li.className === 'editor-separator') {
			ul_width += 18;
		}
		li = li.nextSibling;
	}
	var new_min_width = 234 + ul_width;
	var delta = 0;
	if (this.options.min_width < new_min_width) {
		delta = new_min_width - this.options.min_width;
		// set new width
		this.options.min_width = new_min_width;
		editor.style.width = this.options.min_width + 'px';
	}

	this.adjust_editor_area_size();
	this.source.style.display = 'none';
}

Wysiwyg.prototype = {
	plugins: {},
	update_controls: function () {
		var self = this,
			node = this.selection.get_start(),
			cur = node,
			regex_tagname = /^<(.*?)\>$/,
			regex_classname = /^\.(.*)$/;
		var state = {
			parents: [],
			parent_classes: [],
			selection_collapsed: this.selection.collapsed()
		};
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
			if (this.initialized_plugins.hasOwnProperty(i)) {
				var p = this.initialized_plugins[i], bel = p.el && p.el.parentNode;
				if (!bel) {
					continue;
				}
				if (source_mode) {
					if (p.command === 'show_source' || p.anchorClass === 'bb-fullscreen') {
						self.$.remove_class(bel, 'disabled');
						if (bel.lastChild.nodeName == 'SELECT') {
							bel.lastChild.disabled = false;
						}
					} else {
						self.$.add_class(bel, 'disabled');
						if (bel.lastChild.nodeName == 'SELECT') {
							bel.lastChild.disabled = true;
						}
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
						self.$.in_array(matched_classname[1], state.parent_classes) !== -1) {
						self.$.add_class(bel, 'click');
					} else {
						self.$.remove_class(bel, 'click');
					}
				} else {
					self.$.remove_class(bel, 'disabled');
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
			var button;
			var button_holder = w.$.create_top('li', p.className || false, block);
			if (p.html) {
				button_holder.innerHTML = p.html;
				button = button_holder.firstChild;
			} else {
				button = w.$.create_top('a', false, button_holder);
				if (p.image) {
					var image = w.$.create_top('img', false, button);
					image.src = 'images/' + p.image + '.gif';
				} else if (p.anchorClass) {
					button.className = p.anchorClass;
				}
				button.href = '#';
				button.title = w.locale.translate(plugin);
				p.el = button;
			}

			if (p.init) {
				p.init(button_holder);
			} else {
				button.onclick = function (e) {
					if (button_holder.className === 'disabled') {
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

		var top_panel_buttons = ['bold', '|', 'italic', '|', 'underline', '|', 'fontsize', '|', 'justifyfull', '|', 'justifyleft', '|', 'justifyright', '|', 'justifycenter', '|', 'insertunorderedlist', '|', 'insertorderedlist', '|', 'setcolor', '|', 'fullscreen'];
		if (w.options.admin_mode) {
			top_panel_buttons.push('|');
			top_panel_buttons.push('mode_switcher');
		}

		w.$.each([
			{
				block: w.$.create_top('ul', false, w.controls),
				buttons: top_panel_buttons
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
			this.clean_html();
			this.source.value = this.doc.body.innerHTML;
			this.mode = 'text';
		} else {
			iframe.style.display = '';
			this.source.style.display = 'none';
			this.doc.body.innerHTML = this.source.value;
			this.clean_html();
			try {
				//iframe.contentWindow.document.execCommand("useCSS", false, true);
			} catch (e) {

			}
			this.mode = 'design';
		}
	},
	show_modal_dialog: function (options, contents_div, callback) {
		var self = this;
		var $ = this.$;
		if (self.selection.save_selection) {
			self.selection.save_selection();
		}
		var overlay = document.createElement('div');
		overlay.id = 'overlay';
		var bounds = $.calc_screen_bounds();
		overlay.style.position = $.ie6 ? 'absolute' : 'fixed';
		overlay.style.width = '100%';
		overlay.style.height = '100%';
		
		var overlay_opacity = document.createElement('div');
		overlay_opacity.id = 'overlay_opacity';
		overlay_opacity.style.position = $.ie6 ? 'absolute' : 'fixed';
		overlay_opacity.style.width = '100%';
		overlay_opacity.style.height = '100%';
		overlay_opacity.style.backgroundColor = 'gray';
		overlay_opacity.style.opacity = '0.5';

		if ($.ie6) {
			var scroll = function () {
				var s = $.calc_scroll();
				overlay.style.top = s.y + 'px';
				overlay.style.left = s.x + 'px';
			};
			window.onscroll = scroll;
			scroll();
		} else {
			overlay.style.top = 0;
			overlay.style.left = 0;
			overlay_opacity.style.top = 0;
			overlay_opacity.style.left = 0;
		}

		document.body.appendChild(overlay_opacity);
		document.body.appendChild(overlay);

		var dialog_wrapper = document.createElement('div');
		self.$.add_class(dialog_wrapper, 'modalwindow');
		dialog_wrapper.style.zIndex = 1002;
		dialog_wrapper.style.opacity = '2';
		if (options.width) {
			dialog_wrapper.style.width = options.width + 'px';
		}
		if (options.height) {
			dialog_wrapper.style.height = options.height + 'px';
		}
		overlay.appendChild(dialog_wrapper);

		// round corners
		var corners = ['mtl', 'mtr', 'mbl', 'mbr'];
		for (var i = 0; i < 4; i++) {
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
			// todo: make function calc_drag_bounds working correctly after first call
			init_pos.bounds = self.$.calc_drag_bounds(dialog_wrapper);
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
		};
		
		var fix_position_after_resize = function (e) {
			var x = parseInt(dialog_wrapper.style.left, 10);
			var y = parseInt(dialog_wrapper.style.top, 10);
			var bounds = self.$.calc_drag_bounds(dialog_wrapper);
			dialog_wrapper.style.left = Math.min(x, bounds.maxX) + 'px';
			dialog_wrapper.style.top = Math.min(y, bounds.maxY) + 'px';
		};
		window.onresize = fix_position_after_resize;

		var descr_div = document.createElement('div');
		$.add_class(descr_div, 'modaldescr');

		dialog.appendChild(descr_div);
		descr_div.appendChild(contents_div);

		var footer = document.createElement('div');
		$.add_class(footer, 'modalclose');
		dialog.appendChild(footer);

		function destroy_overlay() {
			overlay.parentNode.removeChild(overlay);
			overlay_opacity.parentNode.removeChild(overlay_opacity);
			if ($.ie6) {
				window.onscroll = null;
			}
			window.onresize = null;
		}

		var btn_cancel = $.create_top('button');
		btn_cancel.innerHTML = 'Cancel';
		btn_cancel.onclick = destroy_overlay;

		var btn_ok = $.create_top('button');
		btn_ok.innerHTML = 'OK';
		btn_ok.onclick = function () {
			if (self.selection.restore_selection) {
				self.selection.restore_selection();
			}
			var r = callback(contents_div);
			if (r === false) {
				return false;
			}
			destroy_overlay();
			self.text_modified();
		};

		footer.appendChild(btn_ok);
		footer.appendChild(btn_cancel);

		dialog_wrapper.style.left = Math.round((overlay.offsetWidth - dialog_wrapper.offsetWidth) / 2) + 'px';
		dialog_wrapper.style.top = Math.round((overlay.offsetHeight - dialog_wrapper.offsetHeight) / 2) + 'px';

		overlay.style.visibility = 'visible';

		return {ok: btn_ok, cancel: btn_cancel};
	},
	update_textarea: function () {
		this.source.value = this.doc.body.innerHTML;
	},
	text_modified_timeout: null
	,
	text_modified: function () {
		var self = this;
		clearTimeout(this.text_modified_timeout);
		this.text_modified_timeout = setTimeout(function () {
			self.update_textarea();
		}, 500);
	},
	adjust_editor_area_size: function () {
		var editor_width = this.workspace.firstChild.offsetWidth,
			editor_height = this.workspace.firstChild.offsetHeight,
			delta_x = this.options.show_media_panel ? 107 + 22 : 22,
			// todo: make this working
			delta_y = this.controls.style.display === 'none' ? 97: 97,
			textplace_width = editor_width - delta_x,
			textplace_height = editor_height - delta_y,
			edit_area_width = textplace_width - 22,
			edit_area_height = textplace_height - 22;

		this.tp.style.width = textplace_width + 'px';
		this.iframe.style.width = edit_area_width + 'px';
		this.source.style.width = edit_area_width + 'px';

		this.tp.style.height = textplace_height + 'px';
		this.iframe.style.height = edit_area_height + 'px';
		this.source.style.height = edit_area_height + 'px';
	},
	clean_html: function () {
		var self = this;
		var html = this.doc.body.innerHTML;
		// Remove comments [SF BUG-1481861].
		html = html.replace(/<\!--[\s\S]*?-->/g, '' ) ;

		html = html.replace(/<o:p>\s*<\/o:p>/g, '') ;
		html = html.replace(/<o:p>[\s\S]*?<\/o:p>/g, '&nbsp;') ;

		// Remove mso-xxx styles.
		html = html.replace( /\s*mso-[^:]+:[^;"]+;?/gi, '' ) ;

		// Remove margin styles.
		html = html.replace( /\s*MARGIN: 0(?:cm|in) 0(?:cm|in) 0pt\s*;/gi, '' ) ;
		html = html.replace( /\s*MARGIN: 0(?:cm|in) 0(?:cm|in) 0pt\s*"/gi, "\"" ) ;

		html = html.replace( /\s*TEXT-INDENT: 0cm\s*;/gi, '' ) ;
		html = html.replace( /\s*TEXT-INDENT: 0cm\s*"/gi, "\"" ) ;

		html = html.replace( /\s*TEXT-ALIGN: [^\s;]+;?"/gi, "\"" ) ;

		html = html.replace( /\s*PAGE-BREAK-BEFORE: [^\s;]+;?"/gi, "\"" ) ;

		html = html.replace( /\s*FONT-VARIANT: [^\s;]+;?"/gi, "\"" ) ;

		html = html.replace( /\s*tab-stops:[^;"]*;?/gi, '' ) ;
		html = html.replace( /\s*tab-stops:[^"]*/gi, '' ) ;

		html = html.replace( /<\/?font.*?>/gi, '');
		//html = html.replace( /<\/?span.*?>/gi, '');
		// Remove style, meta and link tags
		html = html.replace( /<STYLE[^>]*>[\s\S]*?<\/STYLE[^>]*>/gi, '' ) ;
		html = html.replace( /<TITLE[^>]*>[\s\S]*?<\/TITLE[^>]*>/gi, '' ) ;
		html = html.replace( /<(?:META|LINK)[^>]*>\s*/gi, '' ) ;

		// Remove empty styles.
		html =  html.replace( /\s*style="\s*"/gi, '' ) ;

		html = html.replace( /<([a-z][a-z0-9]*)\s*(.*?)>/gi, function (whole, tagname, attrs) {
			attrs = attrs.replace(/([a-z]+)="([^"]*)"\s*/gi, function (attr, name, value) {
				if (name === 'style') {
					var s = self.check_registered_style(value);
					return s ? ' style="' + s + '"' : '';
				}
				return self.is_registered_attribute(name, value) ? ' ' + name + '="' + value + '"' : '';
			});
			return '<' + tagname + attrs + '>';
		});
		this.doc.body.innerHTML = html;
	},
	register_attribute: function (attr, values) {
		var self = this;
		if (!this.registered_attributes) {
			this.registered_attributes = {};
		}
		values = values || true;
		if (!this.$.is_array(values)) {
			values = [values];
		}
		if (!this.registered_attributes[attr]) {
			this.registered_attributes[attr] = [];
		}
		this.$.each(values, function (i, value) {
			self.registered_attributes[attr].push(value);
		});
	},
	is_registered_attribute: function (name, value) {
		if (!this.registered_attributes || !this.registered_attributes[name]) {
			return false;
		}
		return this.$.in_array(value, this.registered_attributes[name]) !== -1;
	},
	register_style: function (property, rule) {
		var self = this;
		if (!this.registered_styles) {
			this.registered_styles = {};
		}
		this.registered_styles[property] = rule || true;
	},
	check_registered_style: function (rules) {
		var self = this;
		if (!self.registered_styles) {
			return false;
		}
		rules = rules.split(/\s*;\s*/);
		var result_rules = [];
		this.$.each(rules, function (i, rule) {
			rule = rule.split(':');
			var property = self.$.trim(rule[0]);
			var value = self.$.trim(rule[1]);
			if (self.registered_styles[property]) {
				if (typeof self.registered_styles[property] === 'function') {
					result_rules.push(property + ': ' + self.registered_styles[property](value));
				} else {
					result_rules.push(property + ': ' + value);
				}
			}
		});
		return result_rules.join(';');
	}
};
