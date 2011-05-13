Importer.include("display_common.js");
Importer.include("display_frame.js");

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
    this.pixmap_halfstar  = new QPixmap(Amarok.Info.scriptPath() + "/smallerhalfstar.png").scaled(this.emblem_x , this.emblem_y);
    this.pixmap_nostar    = new QPixmap(Amarok.Info.scriptPath() + "/smallernostar.png").scaled(this.emblem_x, this.emblem_y);
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
}

DisplayResults.prototype.addEmblemImage = function(frame, pixmap, position)
{
    var img = new QGraphicsPixmapItem(pixmap, frame.widget);

    img.moveBy(frame.x + this.common.albumCover_x + 2 * this.common.albumCover_spacing
               + 5 * this.emblem_x + this.emblem_spacing + this.emblemText_x
               + position * (this.emblem_x + 2 * this.emblem_spacing + this.emblemText_x),
               frame.y + frame.height - this.common.text_thickness - this.emblem_y);
}

DisplayResults.prototype.addRating = function(frame, rating)
{
    var x = frame.x + this.common.albumCover_x + 2 * this.common.albumCover_spacing + this.emblem_spacing;
    var y = frame.y + frame.height - this.common.text_thickness - this.emblem_y;

    for (var r=0; r<Math.floor(rating/2); r++){
        var img_rating = new QGraphicsPixmapItem(this.pixmap_star, frame.widget);
        img_rating.moveBy(x, y);
        x += this.emblem_x;
    }
    if (rating%2==1){
        var img_rating = new QGraphicsPixmapItem(this.pixmap_halfstar, frame.widget);
        rating++;
        img_rating.moveBy(x, y);
        x += this.emblem_x;
    }
    for (var r=Math.floor(rating/2); r<5; r++){
        var img_rating = new QGraphicsPixmapItem(this.pixmap_nostar, frame.widget);
        img_rating.moveBy(x, y);
        x += this.emblem_x;
    }
}


DisplayResults.prototype.drawResults = function (scrollArea, queryType, queryStride, query)
{
    msg("Drawing results");

    var maxWeight = (config.reverseResults == Qt.Unchecked)
                    ? (queryType < 5) ? query[9] : query[7]
                    : (queryType < 5) ? query[query.length - 1] : query[query.length - 3]

    for( var i = 0; i < query.length; i += queryStride)
    {
        var frame = this.common.drawFrame(scrollArea, i / queryStride);

        var imagePath = (query[i+1] != "") ? query[i+1] : Amarok.Info.iconPath(
                            (queryType == 4 || queryType == 8) ? "filename-genre-amarok" : "filename-album-amarok", 64
                        );
        var weight = (queryType < 5) ? query[i+9] : query[i+7];

        var len_hour = Math.floor(query[i+8]/3600000);
        var len_min  = Math.floor((query[i+8]/1000 - len_hour*3600)/60);
        var len_sec  = Math.floor((query[i+8]/1000)%60);
        var len_txt  = (len_hour > 0)
                      ? len_hour + ":" + (len_min<10?"0"+len_min:len_min) + ":" + (len_sec<10?"0"+len_sec:len_sec) //lame, but i'm in a hurry, cba to look it up
                      : len_min + ":" + (len_sec<10?"0"+len_sec:len_sec);

        this.common.addAlbumCover(frame, imagePath);
        this.common.addWeightRating(frame, weight, maxWeight);
        this.common.addSimpleText(frame, query[i+2],  0, true);
        this.common.addSimpleText(frame, query[i+3], this.common.font_bold_height, false);
        this.common.addSimpleText(frame, query[i+4], this.common.font_bold_height + this.common.font_height, false);
        this.addRating(frame, query[i+5]);
        this.addEmblemImage(frame, this.pixmap_score, 0);
        this.addEmblemText(frame, query[i+6], 0);
        this.addEmblemImage(frame, this.pixmap_playcount, 1);
        this.addEmblemText(frame, query[i+7], 1);
        this.addEmblemImage(frame, this.pixmap_length, 2);
        this.addEmblemText(frame, len_txt, 2);
    }

    msg("Finished painting results...");

}

