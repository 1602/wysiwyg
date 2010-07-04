/*global Util, test, equals, ok, */
var _ = new Util({});

test('clean_html: span tags', function () {
    var textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    var wysiwyg = new Wysiwyg(textarea, {
        css_path: '/projects/dmitry/wysiwyg/my/common.css'
    });
    wysiwyg.register_attribute('href');
    var tests = [
        {
            before: "<span style='font-style: italic'>\
                <span style='text-decoration: underline'>Text</span>\
            </span>",
            after: '<i><u>Text</u></i>'
        },
        {
            before: "<span style='font-style: italic'>Text</span>",
            after: '<i>Text</i>'
        },
        {
            before: "<span style='font-style: italic'>\
                <span style='font-style: italic'>Text</span>\
            </span>",
            after: '<i>Text</i>'
        },
        {
            before: "<span style='text-decoration: underline'>\
                <span style='font-style: italic'>Text1</span>\
                <span style='text-decoration: line-through'>Text2</span>\
            </span>",
            after: '<u>\
                <i>Text1</i>\
                <s>Text2</s>\
            </u>'
        },
        {
            before: "<span style='font-style: oblique'>\
                <span style='font-style: italic'><a href='index.html'>Text1</a></span>\
                <span style='text-decoration: line-through'>Text2</span>\
            </span>",
            after: '<i>\
                <i><a>Text1</a></i>\
                <s>Text2</s>\
            </i>'
        }
    ];

    for (i in tests) {
        var t = tests[i];
        wysiwyg.switch_design_mode();
        wysiwyg.source.value = t.before;
        wysiwyg.switch_design_mode();
        wysiwyg.update_textarea();
        equals(wysiwyg.source.value, t.after, t.note);
    }
});
