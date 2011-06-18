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
}

DisplayResults.prototype.drawResults = function (scrollArea, query, indexGr, indexOrd)
{
    msg("Drawing results");

    var maxWeight = config.reverseResults == Qt.Unchecked ? query[indexOrd + 3] : query[query.length + indexOrd - 8];

    for( var i = 0; i < query.length; i += 11)
    {
        var frame = this.common.drawFrame(scrollArea, i / 11);

		var imagePath = "";
		if(query[i+1].substr(0, 18) == "amarok-sqltrackuid")
			imagePath = QDir.homePath() + "/.kde/share/apps/amarok/albumcovers/cache/90@" + MD5(query[i+1]);
		else
		if(query[i+1].substr(0, 1) == "/")
			imagePath = query[i+1];
		else
		if(query[i+1] == "label")
			imagePath = Amarok.Info.iconPath("label-amarok", 64);
		else
		if(query[i+1] == "genre")
			imagePath = Amarok.Info.iconPath("filename-genre-amarok", 64);
		else
		if(query[i+1] == "")
			imagePath = Amarok.Info.iconPath("filename-album-amarok", 64);
		else
			imagePath = QDir.homePath() + "/.kde/share/apps/amarok/albumcovers/large/" + MD5(query[i+1]);

        var weight = query[i+indexOrd+3];

        var len_hour = Math.floor(query[i+7]/3600000);
        var len_min  = Math.floor((query[i+7]/1000 - len_hour*3600)/60);
        var len_sec  = Math.floor((query[i+7]/1000)%60);
        var len_txt  = (len_hour > 0)
                      ? len_hour + ":" + (len_min<10?"0"+len_min:len_min) + ":" + (len_sec<10?"0"+len_sec:len_sec) //lame, but i'm in a hurry, cba to look it up
                      : len_min + ":" + (len_sec<10?"0"+len_sec:len_sec);

        this.common.addAlbumCover(frame, imagePath);
        this.common.addWeightRating(frame, weight, maxWeight);
        this.common.addSimpleText(frame, query[i+2],  0, true);
        this.common.addSimpleText(frame, query[i+9] + (indexGr != 1 && indexGr != 4 ? " " + (parseInt(query[i+9])>1 ? qsTr("albums") : qsTr("album")) : (query[i+9]=="" ? qsTr("V.A.") : "")), this.common.font_bold_height, false);
        this.common.addSimpleText(frame, query[i+8] + (indexGr != 1 ? " " + (parseInt(query[i+8])>1 ? qsTr("tracks") : qsTr("track")) : ""), this.common.font_bold_height + this.common.font_height, false);
        this.addRating(frame, query[i+3]);
        this.addEmblemImage(frame, this.pixmap_score, 0);
		var score = Math.round(parseFloat(query[i+5]))
        this.addEmblemText(frame, String( isNaN(score) ? 0 : score), 0);
        this.addEmblemImage(frame, this.pixmap_playcount, 1);
        this.addEmblemText(frame, query[i+4], 1);
        this.addEmblemImage(frame, this.pixmap_length, 2);
        this.addEmblemText(frame, len_txt, 2);
    }

    msg("Finished painting results...");

}

