var std_commands = {
	bold: 'bb-bold',
	italic: 'bb-italic',
	underline: 'bb-underline',
	justifyfull: 'bb-textjustify',
	justifyleft: 'bb-textleft',
	justifyright: 'bb-textright',
	justifycenter: 'bb-textcenter',
	insertunorderedlist: 'bb-nonumberlist'
};
for (var i in std_commands) {
	if (std_commands.hasOwnProperty(i)) {
		Wysiwyg.prototype.plugins[i] = (function (action, image) {
			return function (w) {
				this.image = image;
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
						if (this.doc.queryCommandState(this.action)) {
							w.$.add_class(bel, 'click');
						} else {
							w.$.remove_class(bel, 'click');
						}
					} catch (e) {
						
					}
				}
			}
		})(i, std_commands[i]);
	}
}

Wysiwyg.prototype.plugins.setcolor = function (w) {
	this.image = 'bb-color';
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
			html += '</ul><ul class="colorpicker">';
		}
		html += '</ul>';
		div.innerHTML = html;
		var selected_color;
		div.onclick = function (e) {
			e = e || window.event;
			var t = e.target || e.srcElement;
			if (t && t.nodeName === 'LI') {
				selected_color = t.style.backgroundColor;
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
				w.selection.wrap_with('span', {'style':'color:' + color});
			}
		});
	}
};

Wysiwyg.prototype.plugins.mode_switcher = function (w) {
	this.image = 'bb-bold';
	this.command = 'show_source';
	this.update = 'always_enabled';
	this.action = function () {
		w.switch_design_mode();
	}
};

Wysiwyg.prototype.plugins.image_and_file = function (w) {
	this.image = 'bb-file';
	this.command = 'insertimage';
	
	function show_image_dialog(callback, properties) {
		var image_div = document.createElement('div');
		image_div.innerHTML = '<form>' +
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
			var f = image_div.firstChild;
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
		var div = w.$.create_top('div');
		div.innerHTML = '<ul class="tabs" id="tabs"><li class="active"><a href="#image">Image</a></li><li><a href="#files">Files</a></li></ul><div id="image"></div><div id="files"></div>';
		div.getElementById('image').appendChild(image_div);
		//div.getElementById('files').appendChild(files_div);
		this.show_modal_dialog({caption: 'Вставка изображения'}, div, function () {
			var f = image_div.firstChild;
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
	}
	
	this.action = function () {
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
		show_image_dialog(function (properties) {
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
	};
	this.update = '<IMG>';
	this.label = '+ Файл';
	this.panel = 'btns_big';
};

Wysiwyg.prototype.plugins.link = function (w) {
	this.image = 'bb-link';
	this.command = 'createlink';
	function show_linkcreator(linkNode, callback) {
		var div = document.createElement('div');
		div.innerHTML = '<form><div class="modal-type">Адрес ссылки:</div>' +
			'<input type="text" name="url" class="modal-text" value="' + (linkNode ? linkNode.getAttribute('href') : '') + '" />' +
			'</form>';
		w.show_modal_dialog({caption: 'Вставка ссылки'}, div, function (div) {
			callback(div.firstChild.url.value);
		});
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
	this.label = 'Ссылка';
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
	this.image = 'bb-quote';
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
};

Wysiwyg.prototype.plugins.spoiler = function (w) {
	this.image = 'bb-spoiler';
	this.command = 'spoiler';
	this.action = function () {
		var spoiler = w.selection.filter('.spoiler');
		if (!spoiler) {
			spoiler = w.$.create('div', 'spoiler');

			var toggler = w.$.create('div', 'toggler', spoiler);
			toggler.innerHTML = 'click to toggle spoiler';
			toggler.setAttribute('onclick', 'var s = this.nextSibling.style; s.display = s.display ? \'none\' : \'\'; return false; ');

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
	this.image = 'bb-hide';
	this.command = 'hide';
	this.update = '.bb-hide';
	function show_hidecreator(hideNode, callback) {
		var div = document.createElement('div');
		div.innerHTML = '<form><div class="modal-type">Количество сообщений:</div>' +
		'<input name="count" class="modal-text" value="' + (hideNode ? hideNode.getAttribute('value') : '') + '" />' +
		'</form>';
		w.show_modal_dialog({caption: 'Вставка скрытого контента'}, div, function (div) {
			var v = parseInt(div.firstChild.count.value, 10);
			if (isNaN(v)) {
				div.firstChild.count.focus();
				error = w.$.create_top('div');
				error.style.color = 'red';
				error.style.marginLeft = '103px';
				error.style.padding = '5px';
				error.innerHTML = 'Введите число';
				div.firstChild.appendChild(error);
				return false;
			}
			callback(v);
		});
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
	this.panel = 'btns_small';
};

Wysiwyg.prototype.plugins.code = function (w) {
	this.image = 'bb-code';
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
};

Wysiwyg.prototype.plugins.smile = function (w) {
	this.image = 'bb-smile';
	this.command = 'smile';
	this.action = function () {
		alert('Not implemented yet. Sorry.');
	};
	this.panel = 'btns_small';
};

Wysiwyg.prototype.plugins.media = function (w) {
	this.image = 'bb-media';
	this.command = 'media';
	function show_media_dialog(callback) {
		var div = document.createElement('div');
		div.innerHTML = '<form><div class="modal-type">Код видео:</div>' +
			'<textarea name="code"></textarea>' +
		'</form>';
		w.show_modal_dialog({caption: 'Вставка медиа'}, div, function (div) {
			callback(div.firstChild.code.value);
		});
	}
	this.update = '.bb-media';
	this.action = function () {
		var media = w.selection.filter('.bb-media');
		if (media) {
			media.parentNode.removeChild(media);
		} else {
			show_media_dialog(function(html){
				media = w.$.create('div', 'bb-media');
				media.innerHTML = html;
				w.selection.insert_node(media);
			});
		}
	};
	this.panel = 'btns_small';
};

Wysiwyg.prototype.plugins.undo = function (w) {
	this.image = 'bb-prev';
	this.action = 'undo';
	this.panel = 'btns_small';
};

Wysiwyg.prototype.plugins.redo = function (w) {
	this.image = 'bb-next';
	this.action = 'redo';
	this.panel = 'btns_small';
};
