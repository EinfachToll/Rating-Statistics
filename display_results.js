Importer.include("utils.js");

function DisplayResults()
{   
    this.css         = read_local_file("/queries/_style.css");
    this.css_replace = {
        color_light    : qcolor_to_html(QApplication.palette().color(QPalette.Light)),
        color_mid      : qcolor_to_html(QApplication.palette().color(QPalette.Mid)),
        color_button   : qcolor_to_html(QApplication.palette().color(QPalette.Button)),
        color_dark     : qcolor_to_html(QApplication.palette().color(QPalette.Dark)),
        color_text     : qcolor_to_html(QApplication.palette().color(QPalette.Text)),
        font_family    : QApplication.font().family(),
        font_size      : QApplication.font().pointSize() + 2,
        font_color     : qcolor_to_html(QApplication.palette().color(QPalette.Text)),
    };
    
    for (x in this.css_replace){
        this.css = this.css.replace(new RegExp("\\$" + x + "\\$",'g'), this.css_replace[x]);
    }
    
    msg("DisplayResults initialized.");
}

DisplayResults.prototype.drawResults2 = function (scrollArea, result, indexGr, indexOrd)
{
    msg("Drawing results2");

    var html = this.css;   

    while (result.read_next()) {
        msg("Drawing row " + result.current_row_id());
        html += result.get_html();
    };
    
    //Amarok.debug(html);
    scrollArea.setHtml(html, new QUrl(filesystem.path_root));
    scrollArea.show();

    msg("Finished painting results...");

};

