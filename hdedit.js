/**
* Allows for one click modification of section headings when viewing a page
* add importScript('User:The Evil IP address/hdedit.js'); to your .js file to use it
* @author Janko Hoener (The Evil IP address)
*/
window.hdedit = {
    
    onclick: function ($e) {
        if (hdedit.$e) {
            hdedit.cancel();
        }
        hdedit.anchor = $e.attr('id');
        hdedit.pagename = mw.config.get('wgPageName');
        hdedit.api = mw.util.wikiScript('api');
        hdedit.$e = $e;
        $.getJSON(hdedit.api, {
                action: 'parse',
                page: this.pagename,
                prop: 'sections',
                format: 'json'
        }, function (data) {
            $.each(data.parse.sections, function (i, v) {
                    if (v.anchor == hdedit.anchor) {
                        hdedit.index = v.index;
                        return false;
                    }
            });
            $.getJSON(hdedit.api, {
                    action: 'parse',
                    page: hdedit.pagename,
                    section: hdedit.index,
                    prop: 'wikitext',
                    format: 'json'
            }, function (obj) {
                hdedit.wikitext = obj.parse.wikitext['*'];
                hdedit.section_wikitext = hdedit.wikitext.replace(/^(=+)\s*(.+?)\s*\1[\s\S]+$/, '$2');
                hdedit.inputsize = hdedit.section_wikitext.length*1.5;
                var form = $('<form>').css('display', 'inline').submit(hdedit.save);
                var input = $('<input>').attr('id', 'hdedit_input').attr('size', hdedit.inputsize).val(hdedit.section_wikitext);
                var button1 = $('<button>').attr('id', 'hdedit_submit').attr('type', 'submit').text('Save');
                var button2 = $('<button>').attr('type', 'button').attr('id', 'hdedit_cancel').text('Cancel').click(hdedit.cancel);
                $(form).append(input).append(button1).append(button2);
                hdedit.form = form;
                $e.after(form);
                $e.hide();
            }
            );
        }
        );
    },
    
    save: function () {
        hdedit.newheading = $(this).parent().find('input').val();
        if (hdedit.newheading == hdedit.section_wikitext) {
            return false;
        }
        $.getJSON(hdedit.api, {
                action: 'query',
                prop: 'info',
                intoken: 'edit',
                titles: hdedit.pagename,
                format: 'json',
                indexpageids: true
        }, function (re) {
            $('#hdedit_input, #hdedit_submit, #hdedit_cancel').attr('disabled', 'disabled');
            $.post(hdedit.api, {
                    action: 'edit',
                    format: 'json',
                    title: hdedit.pagename,
                    section: hdedit.index,
                    minor: true,
                    summary: 'Section heading change: ' + hdedit.section_wikitext + ' → ' + hdedit.newheading 
                        + ' using a [[User:The Evil IP address/hdedit|script]]',
                    text: hdedit.wikitext.replace(/^(=+)(\s*).+?(\s*)\1(\s*)$/m, '$1$2' + hdedit.newheading 
                        + '$3$1$4'),
                    token: re.query.pages[re.query.pageids[0]].edittoken
            }, function (data) {
                if (data.edit.result == 'Success') {
                    window.location.reload();
                }
                else if (data.error) {
                    alert('API returned error code ' + data.error.code + ': ' + data.error.info 
                        + '\nPlease edit the section heading manually.');
                }
                else {
                    alert('Unknown API error. Please edit the section heading manually.');
                }
            });
        });
        return false;
    },
    
    cancel: function () {
        hdedit.$e.show();
        hdedit.form.remove();
    }
};

if (mw.config.get('wgNamespaceNumber') >= 0 && mw.config.get('wgAction') == 'view') {
    $('h1 span.mw-headline, h2 span.mw-headline, h3 span.mw-headline, h4 span.mw-headline, h5 span.mw-headline, h6 span.mw-headline').click(
        function () {
            hdedit.onclick($(this));
        }
    );
}