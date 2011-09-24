Importer.include("md5.js");


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
    
    msg("max weight");
    var maxWeight = config.reverseResults == Qt.Unchecked ? result.get_first("weight") : result.get_last("weight");
    msg(maxWeight);
    
    
    while (result.read_next() != null) {
        msg("Processing row " + result.current_row_id() + " /" + result.get("album_name"));
        
        var frame = this.common.drawFrame(scrollArea, result.current_row_id() - 1);

        
        var pixmap = this.common.pixmap_cache.get_album_pixmap(0);
        if (indexGr == 3 || indexGr == 4){
            pixmap = this.common.pixmap_cache.get_album_pixmap(result.get("album_id"));
        } else {
            msg(indexGr);
        }

       
        var len_hour = Math.floor(result.get("length")/3600000);
        var len_min  = Math.floor((result.get("length")/1000 - len_hour*3600)/60);
        var len_sec  = Math.floor((result.get("length")/1000)%60);
        var len_txt  = (len_hour > 0)
                      ? len_hour + ":" + (len_min<10?"0"+len_min:len_min) + ":" + (len_sec<10?"0"+len_sec:len_sec) //lame, but i'm in a hurry, cba to look it up
                      : len_min + ":" + (len_sec<10?"0"+len_sec:len_sec);
                      
        var img = new QGraphicsPixmapItem(pixmap, frame.widget);
        img.moveBy(frame.x + this.common.albumCover_spacing, frame.y + this.common.albumCover_spacing);

        this.common.addWeightRating(frame, result.get("weight"), maxWeight);
        this.common.addSimpleText(frame, result.get("album_name"),  0, true);
        this.common.addSimpleText(frame, result.get("artist") + (indexGr != 1 && indexGr != 4 ? " " + (parseInt(result.get("artist"))>1 ? qsTr("albums") : qsTr("album")) : (result.get("artist")=="" ? qsTr("V.A.") : "")), this.common.font_bold_height, false);
        this.common.addSimpleText(frame, result.get("track_count") + (indexGr != 1 ? " " + (parseInt(result.get("track_count"))>1 ? qsTr("tracks") : qsTr("track")) : ""), this.common.font_bold_height + this.common.font_height, false);
        this.addRating(frame, result.get("rating"));
        this.addEmblemImage(frame, this.pixmap_score, 0);
        var score = Math.round(parseFloat(result.get("score")));
        this.addEmblemText(frame, String( isNaN(score) ? 0 : score), 0);
        this.addEmblemImage(frame, this.pixmap_playcount, 1);
        this.addEmblemText(frame, result.get("playcount"), 1);
        this.addEmblemImage(frame, this.pixmap_length, 2);
        this.addEmblemText(frame, len_txt, 2);
        
    } while (row != null);

    msg("Finished painting results...");

};

