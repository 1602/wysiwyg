/*global Wysiwyg*/

Wysiwyg.prototype.plugins.image_and_file = function (w) {
	var self = this;
	this.image = 'bb-file';
	this.command = 'insertimage';
	this.file_uploader_path = 'upload_file.php';
	this.file_index_path = 'files.php';
	this.load_files = function () {
		var self = this;
		w.$.ajax(self.file_index_path, function (r) {
			var x;
			// TODO: eval is evil
			eval('x = ' + r);
			var html = '<table width="100%" cellpadding="3"><tbody>';
			for (var i in x) {
				if (x.hasOwnProperty(i)) {
					html += '<tr><td><img style="max-width: 100px; max-height: 100px;" src="' + x[i].path + '" /></td><td><a href="#" onclick="return false;">' + x[i].name + '</a></td><td>delete</td></tr>';
				}
			}
			html += '</tbody></table>';
			self.files_div.lastChild.innerHTML = html;
			self.files_div.lastChild.onclick = function (e) {
				e = e || window.event;
				var t = e.target || e.srcElement;
				if (t && t.nodeName === 'A') {
					self.image_div.firstChild.src.value = t.parentNode.previousSibling.firstChild.src;
					self.modal.ok.onclick();
				}
			};
		});
	};

	function switch_to_image_properties() {
		self.files_div.style.display = 'none';
		self.image_div.style.display = '';
		w.$.add_class(self.image_tab, 'active');
		w.$.remove_class(self.files_tab, 'active');
		return false;
	}

	function switch_to_image_list() {
		self.files_div.style.display = '';
		self.image_div.style.display = 'none';
		w.$.remove_class(self.image_tab, 'active');
		w.$.add_class(self.files_tab, 'active');
		return false;
	}

	this.init_file_upload_form = function () {
		var self = this;

		function start() {
			self.file_upload_form.form_submit.disabled = true;
			self.file_upload_form.form_submit.value = 'Загрузка файла...';
		}

		function complete(path) {
			self.file_upload_form.form_submit.disabled = false;
			self.file_upload_form.form_submit.value = 'Загрузить файл';
			self.load_files();
		}

		this.file_upload_form.onsubmit = function () {
			w.$.ajax_upload(self.file_upload_form, {
				on_start: start,
				on_complete: complete
			});
		};

	};

	this.show_image_dialog = function (callback, properties) {
		var self = this;
		this.image_div = document.createElement('div', 'bb-tab-pane');
		this.image_div.innerHTML = '<form><table><tr>' +
			[
				'<th><label>Адрес:</label></th>' +
					'<td><input type="text" name="src" class="modal-text" /></td>',
				'<th><label>Позиция в тексте:</label></th>' +
					'<td><select name="align"><option value="left">Слева</option><option value="right">Справа</option><option value="baseline">По базовой линии</option></select></td>',
				'<th><label for="image_border_checkbox">Граница</label></th>' +
					'<td><input type="checkbox" name="border" id="image_border_checkbox" /></td>',
				'<th><label>Ссылка:</label></th>' +
					'<td><input type="text" name="link" class="modal-text" /></td>',
				'<th><label>ALT-текст:</label></th>' +
					'<td><input type="text" name="alt" class="modal-text" /></td>',
				'<th><label>CSS стиль:</label></th>' +
					'<td><input type="text" name="css" class="modal-text" /></td>'
			].join('</tr><tr>') +
		'</tr></table></form>';
		var f = this.image_div.firstChild;
		f.onsubmit = function () {
			self.modal.ok.onclick();
			return false;
		};
		if (properties) {
			f.src.value = properties.src;
			f.alt.value = properties.alt;
			f.css.value = properties.css;
			f.border.checked = parseInt(properties.border, 10) === 1;
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

		this.files_div = w.$.create_top('div', 'bb-tab-pane');
		this.files_div.innerHTML = '<div class="select_album" style="display: block;"><form action="' + this.file_uploader_path + '" method="POST" enctype="multipart/form-data"><input type="file" name="picture" /><input type="submit" value="Загрузить файл" name="form_submit" /></form><!--select><option>Новый альбом</option></select--></div><div class="list_images"></div>';
		this.files_div.style.display = 'none';
		this.file_upload_form = this.files_div.firstChild.firstChild;
		this.init_file_upload_form();
		var div = w.$.create_top('div');
		div.innerHTML = '<ul class="tabs" id="tabs"><li class="active"><a href="#image">Внешнее изображение</a></li><li><a href="#files">Изображение из альбома</a></li></ul><div class="clear"></div><div id="image"></div><div id="files"></div>';
		div.lastChild.appendChild(this.image_div);
		div.lastChild.previousSibling.appendChild(this.files_div);
		this.image_tab = div.firstChild.firstChild;
		this.files_tab = div.firstChild.lastChild;
		this.files_tab.firstChild.onclick = switch_to_image_list;
		this.image_tab.firstChild.onclick = switch_to_image_properties;
		this.load_files();
		this.modal = w.show_modal_dialog({
			caption: 'Вставка изображения',
			width: 650,
			height: 400
		}, div, function () {
			var f = self.image_div.firstChild;
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
	};

	this.action = function () {
		var properties;
		var selStart = w.selection.get_start();
		if (selStart && selStart.nodeName === 'IMG' && selStart.className !== 'smile') {
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
		this.show_image_dialog(function (properties) {
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
	w.register_attribute('src');
	w.register_attribute('align');
	w.register_attribute('border');
	w.register_attribute('alt');
	w.register_attribute('href');
	this.update = 'IMG';
	this.html = '<a class="bb-file" href="#">+ Файл</a>';
	// todo: make default action instead of this
	/* this.init = function (element_holder) {
		self.el = element_holder.firstChild;
		element_holder.firstChild.onclick = function () {
			if (!w.$.has_class(self.el.parentNode, 'disabled')) {
				self.action();
			}
		};
	} */
	this.panel = 'btns_big';
};
