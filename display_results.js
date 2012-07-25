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
    
    this.icon_playcount   = Amarok.Info.iconPath("amarok_playcount", 16);
    this.icon_score       = Amarok.Info.iconPath("love-amarok", 16);
    this.icon_length      = Amarok.Info.iconPath("amarok_clock", 16);
    this.icon_star_full   = '<img src="' + Amarok.Info.scriptPath() + '/smallerstar.png"/>';
    this.icon_star_0      = '<img src="' + Amarok.Info.scriptPath() + '/star_0.png"/>';
    this.icon_star_1      = '<img src="' + Amarok.Info.scriptPath() + '/star_1.png"/>';
    this.icon_star_2      = '<img src="' + Amarok.Info.scriptPath() + '/star_2.png"/>';
    this.icon_star_3      = '<img src="' + Amarok.Info.scriptPath() + '/star_3.png"/>';
    
    this.html_color_dark  = qcolor_to_html(QApplication.palette().color(QPalette.Dark));

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

DisplayResults.prototype.drawResults = function (scrollArea, result, indexGr, indexOrd)
{
    msg("Drawing results");

    var maxWeight = config.reverseResults == Qt.Unchecked ? result.get_first("weight") : result.get_last("weight");
    var html = "";
//    var doc = new QTextDocument();

    while (result.read_next()) {
        msg("Processing row " + result.current_row_id() + " /" + result.get("album_name"));

        var pixmap;
        if (indexGr == 2 || indexGr == 3){
        	pixmap = this.common.pixmap_cache.get_artist_pixmap(result.get("id"));
        }
        if (indexGr == 4){
            pixmap = this.common.pixmap_cache.get_album_pixmap(result.get("id"));
        } else {
            msg(indexGr);
        }
        
        Amarok.debug("cover done");


        var len_hour = Math.floor(result.get("length")/3600000);
        var len_min  = Math.floor((result.get("length")/1000 - len_hour*3600)/60);
        var len_sec  = Math.floor((result.get("length")/1000)%60);
        var len_txt  = (len_hour > 0)
                      ? len_hour + ":" + (len_min<10?"0"+len_min:len_min) + ":" + (len_sec<10?"0"+len_sec:len_sec) //lame, but i'm in a hurry, cba to look it up
                      : len_min + ":" + (len_sec<10?"0"+len_sec:len_sec);
                      

        //doc.addResource(QTextDocument.ImageResource, new QUrl("artist://" + result.current_row_id() + ".png"), pixmap);
        
        
        
//        QTextDocument *doc = new QTextDocument;
//        doc->addResource( QTextDocument::ImageResource, QUrl( "myImage.png" ), QPixmap( ":myImage" ) );
                  
        var file = new QFile(Amarok.Info.scriptPath() + "/html/result_frame.html");
        file.open(QIODevice.ReadOnly);
        var ts = new QTextStream(file);
        var hh = ts.readAll();
        hh = hh.replace('$rowid$', result.current_row_id())
        	   .replace('$id', result.get('id'))
		       .replace('$cover$', pixmap)
			   .replace('$name$', result.get('name'))
			   .replace('$info$', result.get('info'))
			   .replace('$playcount$', result.get('playcount'))
			   .replace('$score$', result.get('score'))
			   .replace('$length$', len_txt)
			   .replace('$icon-playcount$', this.icon_playcount)
			   .replace('$icon-score$', this.icon_score)
			   .replace('$icon-length$', this.icon_length)
			   .replace('$rating$', this._calc_rating(result.get('rating')))
			   .replace('$weight-ratio$', Math.round(result.get('weight') / maxWeight * 100))
			   .replace('$color-dark$', this.html_color_dark)
			   ;

        html += hh;

//        if (result.current_row_id() == 5){
//        	break;
//        }

    };
    
    scrollArea.html = html;
//    scrollArea.document = doc;
    scrollArea.show();

    msg("Finished painting results...");

};

DisplayResults.prototype.drawResults2 = function (scrollArea, result, indexGr, indexOrd)
{
    msg("Drawing results2");

    var maxWeight = config.reverseResults == Qt.Unchecked ? result.get_first("weight") : result.get_last("weight");
    var html = "";

    while (result.read_next()) {
        msg("Drawing row " + result.current_row_id());
        html += result.get_html();
    };
    
    scrollArea.html = html;
    scrollArea.show();

    msg("Finished painting results...");

};

