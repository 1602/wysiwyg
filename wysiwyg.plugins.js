/*global Wysiwyg*/
(function () {

	function init_standart_action(action, image) {
		return function (w) {
			//this.anchorClass = image;
			this.anchorClass = image;
			this.action = action;
			this.update = function (bel) {
				try {
					if (!w.doc.queryCommandEnabled(this.action)) {
						w.$.add_class(bel, 'disabled');
					} else {
						w.$.remove_class(bel, 'disabled');
					}
				} catch (e) {
					return;
				}
				try {
					if (w.doc.queryCommandState(this.action)) {
						w.$.add_class(bel, 'click');
					} else {
						w.$.remove_class(bel, 'click');
					}
				} catch (er) {
				}
			};
		};
	}

	var std_commands = {
		bold: 'bb-bold',
		italic: 'bb-italic',
		underline: 'bb-underline',
		justifyfull: 'bb-textjustify',
		justifyleft: 'bb-textleft',
		justifyright: 'bb-textright',
		justifycenter: 'bb-textcenter',
		insertunorderedlist: 'bb-nonumberlist',
		insertorderedlist: 'bb-nonumberlist',
		undo: 'bb-prev',
		redo: 'bb-next'
	};
	for (var i in std_commands) {
		if (std_commands.hasOwnProperty(i)) {
			Wysiwyg.prototype.plugins[i] = init_standart_action(i, std_commands[i]);
		}
	}
})();

Wysiwyg.prototype.plugins.fontsize = function (w) {
	var self = this;
	this.command = 'setfontsize';
	this.className = 'selectplace';
	this.html = '<span class="select"></span>' +
		'<select class="styled">' +
		'	<option value="11px" selected="selected">11 pixel\'s</option>' +
		'	<option value="12px">12 pixel\'s</option>' +
		'	<option value="14px">14 pixel\'s</option>' +
		'	<option value="16px">16 pixel\'s</option>' +
		'	<option value="18px">18 pixel\'s</option>' +
		'	<option value="20px">20 pixel\'s</option>' +
		'</select>';
	this.action = function (font_size) {
		var span;
		try {
		if (w.selection.collapsed()) {
			span = w.$.create('span', 'bb-font-size');
			span.style.fontSize = font_size;
			w.selection.insert_node(span);
		} else {
			var html = w.selection.get_html().replace(/<\/?span.*?>/gi, '');
			var node = w.selection.get_selection_as_node();
			var x = node.firstChild;
			if (x && x.className === 'bb-font-size') {
				x.style.fontSize = font_size;
				w.selection.insert_node(x);
			} else {
				span = w.$.create('span', 'bb-font-size');
				span.style.fontSize = font_size;
				span.innerHTML = html;
				w.selection.insert_node(span);
			}
			/* w.selection.wrap_with('span', {
				'style': 'font-size:' + font_size,
				'class': 'bb-font-size'
			}); */
		}
		} catch(e) {}
		this.clean_spans();
		w.win.focus();
	};
	function is_applicable(node) {
		var count = 0;
		for (var i = 0, len = node.childNodes.length; i < len; i++) {
			var c = node.childNodes[i];
			if (c.nodeType == 3) {
				if (c.nodeValue.replace(/\s/, '') === '') {
					continue;
				} else {
					return false;
				}
			}
			if (c.nodeType == 1 && c.nodeName == 'SPAN' && c.className == 'bb-font-size') {
				count += 1;
			} else {
				return false;
			}
		}
		return count === 1;
	}
	this.clean_spans = function () {
		var spans = w.doc.getElementsByTagName('span');
		for (var i = 0, len = spans.length; i < len; i++) {
			var span = spans[i];
			if (span.className != 'bb-font-size') {
				continue;
			}
			var has_child = false;
			while (is_applicable(span)) {
				span = span.firstChild.nextSibling || span.firstChild;
				has_child = true;
			}
			if (has_child) {
				spans[i].style.fontSize = span.style.fontSize;
				spans[i].innerHTML = span.innerHTML;
				this.clean_spans();
				break;
			}
		}
		//console.log(spans);
	};
	this.update = function (button) {
		w.$.remove_class(button, 'disabled');
		button.lastChild.disabled = false;
	};
	this.init = function (element_holder) {
		self.el = element_holder.lastChild;
		w.$.add_event(self.el, 'change', function () {
			self.action(self.el.options[self.el.selectedIndex].value);
		});
	};
	w.register_attribute('class', 'bb-font-size');
	w.register_style('font-size', function (value) {
		value = parseInt(value);
		if (value > 20) {
			value = 20;
		}
		if (value < 11) {
			value = 11;
		}
		return value + 'px';
	});
};

Wysiwyg.prototype.plugins.setcolor = function (w) {
	this.anchorClass = 'bb-color';
	this.command = 'setcolor';
	this.update = 'always_enabled';

	function show_colorpicker(callback) {
		var div = w.$.create_top('div');
		var html = '<ul class="colorpicker">';
		var colors = '0369CF'.split('');
		for (var r = 0; r < 6; r += 1) {
			for (var g = 0; g < 6; g += 1) {
				for (var b = 0; b < 6; b += 1) {
					var c = colors[r] + colors[g] + colors[b];
					html += '<li style="background-color:#' + c + '">&nbsp;</li>';
				}
			}
			html += '</ul>';
			if (r < 5) {
				html += '<ul class="colorpicker">';
			}
		}
		html += '</ul><div class="clear" style="font-weight: 700; height: 32px;">Цвет не выбран</div>';
		div.innerHTML = html;
		var selected_color;
		div.onclick = function (e) {
			e = e || window.event;
			var t = e.target || e.srcElement;
			if (t && t.nodeName === 'LI') {
				selected_color = t.style.backgroundColor;
				/* div.lastChild.innerHTML = 'Выбран цвет <div style="display:inline-block; vertical-align: middle; width:20px; height: 20px; border: 1px solid #000; margin:5px; background-color: ' + selected_color + '"></div>'; */
				div.style.color = t.style.backgroundColor;
				div.lastChild.innerHTML = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

			}
		};
		w.show_modal_dialog({caption: 'Выбор цвета'}, div, function (div) {
			callback(selected_color);
		});
	}

	this.action = function () {
		show_colorpicker(function (color) {
			if (w.selection.collapsed()) {
				var colored_span = w.$.create('span');
				colored_span.setAttribute('style', 'color:' + color);
				w.selection.insert_node(colored_span);
				w.win.focus();
			} else {
				w.selection.wrap_with('span', {'style': 'color:' + color});
			}
		});
	};
};

Wysiwyg.prototype.plugins.mode_switcher = function (w) {
	this.anchorClass = 'bb-bold';
	this.command = 'show_source';
	this.update = 'always_enabled';
	this.action = function () {
		w.switch_design_mode();
	};
};

Wysiwyg.prototype.plugins.link = function (w) {
	var self = this;
	this.anchorClass = 'bb-link';
	this.command = 'createlink';
	w.register_attribute('href');
	function show_linkcreator(linkNode, callback) {
		var div = document.createElement('div');
		div.innerHTML = '<form><div class="modal-type">Адрес ссылки:</div>' +
			'<input type="text" name="url" class="modal-text" value="' + (linkNode ? linkNode.getAttribute('href') : '') + '" />' +
			'</form>';
		var modal = w.show_modal_dialog({caption: 'Вставка ссылки'}, div, function (div) {
			callback(div.firstChild.url.value);
		});
		div.firstChild.onsubmit = function () {
			modal.ok.onclick();
		};
	}
	this.action = function () {
		var linkNode = w.selection.filter('a');
		show_linkcreator(linkNode, function (link) {
			//w.doc.execCommand('createlink', false, link);
			if (linkNode) {
				linkNode.setAttribute('href', link);
			} else {
				w.selection.wrap_with('a', {'href': link});
				w.win.focus();
			}
		});
	};
	this.html = '<a class="bb-link" href="#">Ссылка</a>';
	// todo: make default action instead of this
	this.init = function (element_holder) {
		self.el = element_holder.firstChild;
		self.el.onclick = function () {
			if (!w.$.has_class(self.el.parentNode, 'disabled')) {
				self.action();
			}
			return false;
		};
	};
	this.panel = 'btns_big';
	this.update = function (bel, state) {
		if (w.$.in_array('A', state.parents) !== -1) {
			w.$.add_class(bel, 'click');
			w.$.remove_class(bel, 'disabled');
		} else {
			w.$.remove_class(bel, 'click');
			if (state.selection_collapsed) {
				w.$.add_class(bel, 'disabled');
			} else {
				w.$.remove_class(bel, 'disabled');
			}
		}
	};
};

Wysiwyg.prototype.plugins.quote = function (w) {
	var self = this;
	this.anchorClass = 'bb-quote';
	this.command = 'quote';
	this.action = function () {
		var quote = w.selection.filter('blockquote');
		if (quote) {
			w.$.remove_node_with_its_contents(quote);
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

	};
	this.update = '<BLOCKQUOTE>';
	this.panel = 'btns_small';
	this.top_selection = w.$.selection(true);
	this.n = 1;
	w.insert_quote = function (author, div_id) {
		var quote = w.doc.createElement('blockquote');
		var top_selection_html = self.top_selection.get_html();
		if (!top_selection_html) {
			if (div_id) {
				var source_el = document.getElementById(div_id);
				top_selection_html = source_el ? source_el.innerHTML : '';
			} else {
				top_selection_html = '<br />';
			}
		}
		if (author) {
			top_selection_html = '<div class="bb-quote-author">' + author + '</div>' + top_selection_html;
		}
		quote.innerHTML = top_selection_html;
		if (w.is_msie) {
			w.doc.body.innerHTML += '<blockquote id="bb_quote_' + self.n + '">' + top_selection_html + '</blockquote>';
			w.win.location.hash = 'bb_quote_' + self.n;
			self.n += 1;
		} else {
			w.selection.insert_node(quote);
		}
	};
};

Wysiwyg.prototype.plugins.spoiler = function (w) {
	this.anchorClass = 'bb-spoiler';
	this.command = 'spoiler';
	w.register_attribute('class', ['spoiler', 'toggler', 'hidden_text']);
	this.action = function () {
		var spoiler = w.selection.filter('.spoiler');
		if (!spoiler) {
			spoiler = w.$.create('div', 'spoiler');

			var toggler = w.$.create('div', 'toggler', spoiler);
			toggler.innerHTML = '&nbsp;';
			//toggler.setAttribute('onclick', 'var s = this.nextSibling.style; s.display = s.display ? \'none\' : \'\'; return false; ');

			var hidden_text = w.$.create('div', 'hidden_text', spoiler);

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
			w.$.remove_node_with_its_contents(spoiler.lastChild);
			w.$.remove_node_with_its_contents(spoiler);
		}
		w.win.focus();
	};
	this.update = '.spoiler';
	this.panel = 'btns_small';
};

Wysiwyg.prototype.plugins.hide = function (w) {
	this.anchorClass = 'bb-hide';
	this.command = 'hide';
	this.update = '.bb-hide';
	function show_hidecreator(hideNode, callback) {
		var div = document.createElement('div');
		div.innerHTML = '<form><div class="modal-type">Количество сообщений:</div>' +
		'<input name="count" class="modal-text" value="' + (hideNode ? hideNode.getAttribute('value') : '') + '" />' +
		'</form>';
		var modal = w.show_modal_dialog({caption: 'Вставка скрытого контента'}, div, function (div) {
			var v = parseInt(div.firstChild.count.value, 10);
			if (isNaN(v)) {
				div.firstChild.count.focus();
				var error = w.$.create_top('div');
				error.style.color = 'red';
				error.style.marginLeft = '103px';
				error.style.padding = '5px';
				error.innerHTML = 'Введите число';
				div.firstChild.appendChild(error);
				return false;
			}
			callback(v);
		});
		div.firstChild.onsubmit = function () {
			modal.ok.onclick();
		};
	}
	this.action = function () {
		var hide = w.selection.filter('.bb-hide');
		show_hidecreator(hide, function (value) {
			if (hide) {
				if (value) {
					hide.setAttribute('value', value);
				} else {
					w.$.remove_node_with_its_contents(hide);
				}
				return;
			}
			if (w.selection.collapsed()) {
				var code = w.$.create('div', 'bb-hide');
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
	};
	w.register_attribute('value');
	w.register_attribute('class', 'bb-hide');
	this.panel = 'btns_small';
};

Wysiwyg.prototype.plugins.code = function (w) {
	this.anchorClass = 'bb-code';
	this.command = 'code';
	this.action = function () {
		var code = w.selection.filter('.bb-code');
		if (code) {
			w.$.remove_node_with_its_contents(code);
		} else {
			if (w.selection.collapsed()) {
				code = w.$.create('pre', 'bb-code');
				code.innerHTML = '<br/>';
				w.selection.insert_node(code);
			} else {
				w.selection.wrap_with('pre', 'bb-code');
			}
		}
	};
	this.panel = 'btns_small';
	this.update = '.bb-code';
	w.register_attribute('class', 'bb-code');
};

Wysiwyg.prototype.plugins.smile = function (w) {
	this.anchorClass = 'bb-smile';
	this.command = 'smile';
	this.action = function () {
		var div = w.$.create_top('div');
		var html = '';
		var selected_image;
		w.$.each([
			'icon_arrow.gif',
			'icon_biggrin.gif',
			'icon_confused.gif',
			'icon_cool.gif',
			'icon_cry.gif',
			'icon_doubt.gif',
			'icon_doubt2.gif',
			'icon_eek.gif',
			'icon_evil.gif',
			'icon_exclaim.gif',
			'icon_frown.gif',
			'icon_fun.gif',
			'icon_idea.gif',
			'icon_kaddi.gif',
			'icon_lol.gif',
			'icon_mrgreen.gif',
			'icon_neutral.gif',
			'icon_question.gif',
			'icon_razz.gif',
			'icon_redface.gif',
			'icon_rolleyes.gif',
			'icon_sad.gif',
			'icon_silenced.gif',
			'icon_smile.gif',
			'icon_smile2.gif',
			'icon_surprised.gif',
			'icon_twisted.gif',
			'icon_wink.gif'
		], function (i, image) {
			html += '<img onmouseover="this.style.borderColor = \'#ddd\'" onmouseout="this.style.borderColor = \'#fff\'" src="images/smileys/' + image + '" style="margin:3px;padding: 3px; border: 1px solid #fff; cursor: pointer;" />';
			if (i % 7 === 6) {
				html += '<br />';
			}
		});
		div.innerHTML = html;
		var d = w.show_modal_dialog({caption: 'Вставка смайлика', width: 226}, div, function (div) {
			if (selected_image) {
				var node = w.$.create('img');
				node.src = selected_image;
				w.selection.insert_node(node);
			}
		});
		div.onclick = function (e) {
			e = e || window.event;
			var t = e.target || e.srcElement;
			if (t && t.nodeName === 'IMG') {
				selected_image = t.src;
				d.ok.onclick();
			}
		};
	};
	this.panel = 'btns_small';
};

Wysiwyg.prototype.plugins.media = function (w) {
	this.anchorClass = 'bb-media';
	this.command = 'media';
	function show_media_dialog(callback) {
		var div = document.createElement('div');
		div.innerHTML = '<form><div class="modal-type">Код видео:</div>' +
			'<textarea name="code"></textarea>' +
		'</form>';
		var modal = w.show_modal_dialog({caption: 'Вставка медиа'}, div, function (div) {
			callback(div.firstChild.code.value);
		});
		div.firstChild.onsubmit = function () {
			modal.ok.onclick();
		};
	}
	this.update = '.bb-media';
	this.action = function () {
		var media = w.selection.filter('.bb-media');
		if (media) {
			media.parentNode.removeChild(media);
		} else {
			show_media_dialog(function (html) {
				media = w.$.create('div', 'bb-media');
				media.innerHTML = html;
				w.selection.insert_node(media);
			});
		}
	};
	this.panel = 'btns_small';
	w.register_attribute('class', 'bb-media');
};

Wysiwyg.prototype.plugins.undo = function (w) {
	this.anchorClass = 'bb-prev';
	this.action = 'undo';
};

Wysiwyg.prototype.plugins.redo = function (w) {
	this.anchorClass = 'bb-next';
	this.action = 'redo';
};

Wysiwyg.prototype.plugins.fullscreen = function (w) {
	var FULLSCREEN_PADDING = 20;
	var self = this;
	this.anchorClass = 'bb-fullscreen';
	
	var default_workspace_style = {
		position: '',
		left: '',
		top: '',
		width: '',
		height: '',
		background: ''
	};
	
	var fullscreen_workspace_style = {
		position: 'absolute',
		left: 0,
		top: 0,
		background: '#fff',
		zIndex: 2
	};
	
	var dim = {};
	
	var overlay = document.createElement('div');
	overlay.className = 'overlay';

	document.body.appendChild(overlay);

	function store_size() {
		dim.edw = w.workspace.firstChild.offsetWidth;
		dim.edh = w.workspace.firstChild.offsetHeight;
		dim.tpw = w.tp.offsetWidth;
		dim.tph = w.tp.offsetHeight;
		dim.ifw = w.iframe.offsetWidth;
		dim.ifh = w.iframe.offsetHeight;
	}
	
	function restore_size() {
		w.workspace.firstChild.style.width = dim.edw + 'px';
		w.workspace.firstChild.style.height = dim.edh + 'px';
		w.adjust_editor_area_size();
	}

	function fullscreen() {
		var bounds = w.$.calc_screen_bounds();
		w.workspace_wrapper.style.width = bounds.w - 75 + 'px';
		w.workspace_wrapper.style.height = bounds.h - 60 + 'px';
		w.workspace_wrapper.style.padding = '10px';
		var dw = w.workspace_wrapper.offsetWidth - w.workspace.firstChild.offsetWidth - 2;
		var dh = w.workspace_wrapper.offsetHeight - w.workspace.firstChild.offsetHeight - 22;
		w.workspace.firstChild.style.width = w.workspace.firstChild.offsetWidth + dw + 'px';
		w.workspace.firstChild.style.height = w.workspace.firstChild.offsetHeight + dh + 'px';
		w.adjust_editor_area_size();
	}

	var scroll_timeout = false;
	function scroll() {
		if (w.$.browser.msie || w.$.browser.opera || w.$.browser.mozilla) {
			window.scrollTo(w.fix_scroll.x, w.fix_scroll.y);
			return;
		}
		if (scroll_timeout) {
			clearTimeout(scroll_timeout);
		}
		scroll_timeout = setTimeout(function () {
			window.scrollTo(w.fix_scroll.x, w.fix_scroll.y);
		}, 100);
	}

	function adjust_size() {
		if (!w.fullscreen) {
			w.resizer.style.display = '';
			overlay.style.visibility = 'hidden';
			w.$.set_style(w.workspace, default_workspace_style);
			restore_size();
		} else {
			w.fix_scroll = w.$.calc_scroll();
			w.resizer.style.display = 'none';
			w.$.set_style(w.workspace, fullscreen_workspace_style);
			var offset = w.$.get_offset(w.workspace);
			if (offset.top !== 0) { // has relative positioned element in his parents
				w.workspace.style.top = w.fix_scroll.y - offset.top + 'px';
				w.workspace.style.left = w.fix_scroll.x - offset.left + 'px';
			} else { // normal position, just adjust scrolls
				w.workspace.style.top = w.fix_scroll.y + 'px';
				if (w.$.browser.msie) {
					// strange msie behaviour
					setTimeout(function () {
						w.workspace.style.top = w.fix_scroll.y + 'px';
					}, 500);
				}
				w.workspace.style.left = w.fix_scroll.x + 'px';
			}
			scroll();
			store_size();
			fullscreen();
		}
	}

	function switch_mode() {
		w.fullscreen = !w.fullscreen;
		if (w.fullscreen) {
			w.$.add_event(window, 'resize', fullscreen);
			w.$.add_event(window, 'scroll', scroll);
		} else {
			w.$.remove_event(window, 'resize', fullscreen);
			w.$.remove_event(window, 'scroll', scroll);
		}
	}

	this.action = function () {
		switch_mode();
		adjust_size();
	};

	this.update = function(){return true};
};
