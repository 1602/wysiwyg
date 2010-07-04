/*global Util, test, equals, ok, */
var _ = new Util({});

test('Util.prototype.trim()', function () {
	equals(_.trim(''), '', 'Empty string');
	ok(_.trim(' 	') === '', 'String with whitespaces only');
	same(_.trim(), '', 'No params');
	equals(_.trim(' x'), 'x', 'Trim at the beginning of line');
	equals(_.trim('x '), 'x', 'Trim at the end of line');
	equals(_.trim(' x '), 'x', 'Trim at the both beginning and end of line');
	equals(_.trim('		x	'), 'x', 'Trim tabs');
	equals(_.trim('		x	 y	'), 'x	 y', 'Should not remove inner spaces and tabs');
});

test('Util.prototype.is_array()', function () {
	ok(_.is_array([]), 'Should check array: [] is array');
	ok(_.is_array(new Array()), 'Should check array: new Array is array');
	ok(!_.is_array(new Object()), 'Should check object: new Object is not array');
	ok(!_.is_array({}), 'Should check object: {} is not array');
	ok(!_.is_array(0), 'Should check number: 0 is not array');
	ok(!_.is_array("foo"), 'Should check string: "foo" is not array');
});

test('Util.prototipe.each()', function () {
	var obj = {
		one: 1,
		two: 2,
		three: 3
	};
	var arr = [1, 2, 3, 4, 5];

	function Prototyped_test_obj() {
		this.a = 1;
		this.b = 2;
		this.c = 3;
		this.d = 4;
	}
	Prototyped_test_obj.prototype.e = 5;
	Prototyped_test_obj.prototype.f = 6;
	
	var pto = new Prototyped_test_obj();

	var count_elements = 0;
	var sum_elements = 0;
	function callback(i, n) {
		count_elements++;
		sum_elements += n;
	}

	_.each(obj, callback);
	equals(count_elements, 3, 'Should operate simple objects. Part 1');
	equals(sum_elements, 6, 'Should operate simple objects. Part 2');

	count_elements = 0;
	sum_elements = 0;
	_.each(arr, callback);
	equals(count_elements, 5, 'Should operate arrays. Part 1');
	equals(sum_elements, 15, 'Should operate arrays. Part 2');

	count_elements = 0;
	sum_elements = 0;
	_.each(pto, callback);
	equals(count_elements, 4, 'Should operate prototyped objects. Part 1');
	equals(sum_elements, 10, 'Should operate prototyped objects. Part 2');
	
	var iterations = 0;
	_.each([1, 2, 3], function (i, n) {
		iterations++;
		if (n === 2) {
			return false;
		}
	});
	equals(iterations, 2, 'Should stop when callback returns false');
	
	iterations = 0;
	_.each([1, 2, 3, 4, 5, 6], function (i, n) {
		iterations++;
		if (n === 1) {
			return true;
		}
		if (n === 2) {
			return;
		}
		if (n === 3) {
			return null;
		}
		if (n === 4) {
			return 0;
		}
		if (n === 5) {
			return void(0);
		}
		if (n === 6) {
			return false;
		}
	});
	equals(iterations, 6, 'Should not stop when callback do not returns false');
});

test('Util.prototype.map()', function () {
	var undef, f = function (i, n) {
		if (n != 2) return n;
	};

	same(
		[1, 3],
		_.map([1, 2, 3], f),
		'Should return compact array');

	same(
		[1, undef, 3],
		_.map([1, 2, 3], f, true),
		'Should return not compact array');

	same(
		{a:1, c:3},
		_.map({a:1, b:2, c:3}, f),
		'Should return compact object');

	same(
		{a:1, b:undef, c:3},
		_.map({a:1, b:2, c:3}, f, true),
		'Should return not compact object');
});

test('Util.prototype.in_array()', function () {
	ok(_.in_array(1, [2, 3]) === -1, 'Should return -1 on fail');
	ok(_.in_array(1, [2, 3, 1]) === 2, 'Should return element index on success');
	ok(_.in_array('1', [2, 3, 1]) === -1, 'Should use strict compare operator');
	ok(_.in_array(1, [1, 2, 3, 1]) === 0, 'Should stops after first equality');
});

test('Util.prototype.has_class()', function () {
	var div = document.createElement('div');
	div.className = 'class';
	ok(_.has_class(div, 'class') && !_.has_class(div, 'la'), 'Should check single class id');
	div.className = 'class1 another_class class2';
	ok(
		_.has_class(div, 'class1') &&
		_.has_class(div, 'class2') &&
		_.has_class(div, 'another_class') &&
		!_.has_class(div, 'class'),
		'Should check multiple class ids');
	div.className = 'c1  c2		c3';
	ok(_.has_class(div, 'c1') && _.has_class(div, 'c2') && _.has_class(div, 'c3'),
		'Should allow multiple spaces and tabs as class id separators');
});

test('Util.prototype.add_class()', function () {
	var div = document.createElement('div');
	_.add_class(div, 'class');
	equal(div.className, 'class', 'Should add first class')
	_.add_class(div, 'x');
	equal(div.className, 'class x', 'Should add second class')
});

test('Util.prototype.remove_class()', function () {
	var div = document.createElement('div');
	div.className = 'a b c';
	_.remove_class(div, 'b');
	equals(div.className, 'a c', 'Should remove class and additional space');
	div.className = 'a b		c';
	_.remove_class(div, 'c');
	equals(div.className, 'a b', 'Should allow multiple spaces and tabs as class ids separator');
	div.className = 'abc';
	_.remove_class(div, 'b');
	equals(div.className, 'abc', 'Should not just replace part of string');
});
