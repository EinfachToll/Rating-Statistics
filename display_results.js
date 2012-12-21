Importer.include("utils.js");

function DisplayResults(displayCommon)
{
    this.common = displayCommon;

    // Emblem dimensions
    this.emblem_x         = 16;
    this.emblem_y         = 16;
    this.emblem_spacing   =  4;
    this.emblemText_x     = this.common.font_metrics.width("999");

    // Emblem Pixmaps
    this.pixmap_star      = new QPixmap(Amarok.Info.scriptPath() + "/smallerstar.png").scaled(this.emblem_x, this.emblem_y);
    this.pixmap_playcount = new QPixmap(Amarok.Info.iconPath( "amarok_playcount", this.emblem_x));
    this.pixmap_score     = new QPixmap(Amarok.Info.iconPath( "love-amarok", this.emblem_x));
    this.pixmap_length    = new QPixmap(Amarok.Info.iconPath( "amarok_clock", this.emblem_x));
    
    this.icon_playcount   = "file://" + Amarok.Info.iconPath("amarok_playcount", 16);
    this.icon_score       = "file://" + Amarok.Info.iconPath("love-amarok", 16);
    this.icon_length      = "file://" + Amarok.Info.iconPath("amarok_clock", 16);
    this.icon_star_full   = '<img src="file://' + Amarok.Info.scriptPath() + '/smallerstar.png"/>';
    this.icon_star_0      = '<img src="file://' + Amarok.Info.scriptPath() + '/star_0.png"/>';
    this.icon_star_1      = '<img src="file://' + Amarok.Info.scriptPath() + '/star_1.png"/>';
    this.icon_star_2      = '<img src="file://' + Amarok.Info.scriptPath() + '/star_2.png"/>';
    this.icon_star_3      = '<img src="file://' + Amarok.Info.scriptPath() + '/star_3.png"/>';
    
    this.css              = read_local_file("/queries/_style.css");
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

DisplayResults.prototype.addEmblemText = function(frame, text, position)
{
    var txt = new QGraphicsSimpleTextItem(text, frame.widget);

    txt.moveBy(frame.x + this.common.albumCover_x + 2 * this.common.albumCover_spacing
               + 5 * this.emblem_x + this.emblem_spacing + this.emblemText_x
               + this.emblem_x + this.emblem_spacing
               + position * (this.emblem_x + 2 * this.emblem_spacing + this.emblemText_x),
               frame.y + frame.height - this.common.text_thickness - this.emblem_y);
    txt.setBrush(this.common.brush_text);
};

DisplayResults.prototype.addEmblemImage = function(frame, pixmap, position)
{
    var img = new QGraphicsPixmapItem(pixmap, frame.widget);

    img.moveBy(frame.x + this.common.albumCover_x + 2 * this.common.albumCover_spacing
               + 5 * this.emblem_x + this.emblem_spacing + this.emblemText_x
               + position * (this.emblem_x + 2 * this.emblem_spacing + this.emblemText_x),
               frame.y + frame.height - this.common.text_thickness - this.emblem_y);
};

DisplayResults.prototype.addRating = function(frame, rating)
{
    var x = frame.x + this.common.albumCover_x + 2 * this.common.albumCover_spacing + this.emblem_spacing;
    var y = frame.y + frame.height - this.common.text_thickness - this.emblem_y;

	var num_full_star = Math.floor(rating/2);
	var value_half_star = rating - 2*num_full_star;

	for (var r=0; r<num_full_star; ++r) {
		var img_rating = new QGraphicsPixmapItem(this.pixmap_star, frame.widget);
        img_rating.moveBy(x, y);
        x += this.emblem_x;
    }

    var halfstar = new QPixmap(Amarok.Info.scriptPath() + "/smallerstar.png").scaled(this.emblem_x * value_half_star / 2.0, this.emblem_y, Qt.IgnoreAspectRatio, Qt.SmoothTransformation);
	var img_rating = new QGraphicsPixmapItem(halfstar, frame.widget);
	img_rating.moveBy(x, y);
};

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

