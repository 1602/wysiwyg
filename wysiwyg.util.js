// 15-17 x 21-24

function Util(wysiwyg) {
	var self = this;
	this.wysiwyg = wysiwyg;
	var user_agent = navigator.userAgent.toLowerCase();
	this.browser = {
		version: (user_agent.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [0, '0'])[1],
		safari: /webkit/.test(user_agent),
		opera: /opera/.test(user_agent),
		msie: /msie/.test(user_agent) && !/opera/.test(user_agent),
		mozilla: /mozilla/.test(user_agent) && !/(compatible|webkit)/.test(user_agent)
	};
	
	function create_element(nodeName, class_name, parent_node) {
		var node = this.createElement(nodeName);
		if (class_name) {
			self.add_class(node, class_name);
		}
		if (parent_node) {
			parent_node.appendChild(node);
		}
		return node;
	}
	
	this.create = function () {
		return create_element.apply(wysiwyg.doc, arguments);
	};
	
	this.create_top = function (node_name, class_name, parent_node) {
		return create_element.apply(document, arguments);
	};
}

Util.prototype = {
	trim: function (text) {
		return (text || "").replace( /^\s+|\s+$/g, "" );
	},
	each: function (collection, callback) {
		if (this.is_array(collection)) {
			for (var i = 0, len = collection.length; i < len; i++) {
				if (callback(i, collection[i]) === false) {
					break;
				}
			}
		} else {
			for (var i in collection) {
				if (collection.hasOwnProperty(i)) {
					if (callback(i, collection[i]) === false) {
						break;
					}
				}
			}
		}
	},
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
	set_style: function (element, style) {
		for (var i in style) {
			if (style.hasOwnProperty(i)) {
				element.style[i] = style[i];
			}
		}
	},
	add_event: function (element, events, callback) {
		if (this.is_array(element)) {
			for (var i = 0, len = element.length; i < len; i++ ) {
				this.add_event(element[i], events, callback);
			}
			return;
		}
		events = events.split(' ');
		for (var i = 0; i < events.length; i++) {
			var event = events[i];
			if (element.attachEvent) {
				element.attachEvent(event, callback);
			} else {
				element.addEventListener(event, callback, false);
			}
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
	wrap: function (n, w) {
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
	remove_class: function (el, class_name) {
		if (!el || !el.className) {
			return;
		}
		var classes = el.className;
		if (!classes) {
			return;
		}
		classes = classes.toLowerCase().replace(class_name, '').replace(/\s+/, ' ');
		el.className = classes;
	},
	has_class: function (el, class_name) {
		if (!el || !el.className) {
			return false;
		}
		return el.className.toLowerCase().indexOf(class_name.toLowerCase()) !== -1;
	},
	add_class: function (el, class_name) {
		if (this.has_class(el, class_name)) {
			return false;
		}
		var classes = el.className ? el.className.split(/\s+/) : [];
		classes.push(class_name);
		el.className = classes.join(' ');
	},
	remove_node_with_its_contents: function (node) {
		var child = node.firstChild;
		while (child) {
			node.parentNode.insertBefore(child.cloneNode(true), node);
			child = child.nextSibling;
		}
		node.parentNode.removeChild(node);
	},
	get_parent_by_class_name: function (node, class_name) {
		while (node) {
			if (node.nodeName && this.has_class(node, class_name)) {
				return node;
			}
			node = node.parentNode;
		}
		return false;
	},
	get_parent_by_tag_name: function (node, tag_name) {
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

Util.prototype.selection = function () {
	var ie_selection = function (win) {
		var self = this;
		this.win = win;
		this.doc = win.document;

		this.create_range = function() {
			this.win.focus();
			try { 
				this.r = this.doc.selection.createRange(); 
			} catch(e) { 
				this.r = this.doc.body.createTextRange(); 
			}
			return this.r;
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
				this.create_range();
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
			return sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : self.doc.createRange();
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
							new_parent.setAttribute(i === 'class' ? 'className' : i, class_name[i]);
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
	
	var S = this.browser.msie ? ie_selection : normal_selection;
	
	S.prototype.filter = function (selector) {
		var s = this.get_start();
		switch (selector.charAt(0)) {
		case '.':
			return this.$.get_parent_by_class_name(s, selector.substr(1));
			break;
		default:
			return this.$.get_parent_by_tag_name(s, selector);
		}
	}
	
	var s = new S(this.wysiwyg.win);
	s.$ = this;
	return s;
};

Util.prototype.ajax = function (url, callback) {
	var xhr = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
	xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    }
    xhr.send();
}
