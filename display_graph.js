function GraphPainter(displayCommon)
{
    this.common = displayCommon;

    this.frame_width                = this.common.frame_x;
    this.frame_height               = this.common.frame_y * 3;
    this.frame_thickness            = 10;

    this.graph_x                    = this.frame_thickness;
    this.graph_width                = this.frame_width - this.frame_thickness - this.graph_x;

    this.graph_y                    = this.frame_thickness;
    this.graph_height               = this.frame_height - this.frame_thickness;

    this.gradient_up = new QLinearGradient( new QPointF(0, 3 * this.common.frame_y), new QPointF(0, 0));
    this.gradient_up.setColorAt(0, this.common.color_dark);
    this.gradient_up.setColorAt(1, this.common.color_button);
    this.brush_gradient_up = new QBrush(this.gradient_up);
    msg("GraphPainter initialized.");
}

GraphPainter.prototype.drawGraph = function(scrollArea, query, indexOrd)
{
    msg("painting graph...");

    var widget = scrollArea.addRect(0, 0, this.frame_width, this.frame_height, this.common.pen_mid, this.common.brush_solid_dark);
    scrollArea.sceneRect = new QRectF(0, 0, this.frame_width, this.frame_height);

    var min_year       = query[1];
    var max_year       = query[query.length - 2];
    var years_count    = max_year - min_year + 1;
    var polygon_points = new Array();

	var max_value = 0;
	if(indexOrd == 0) max_value = 10;
	else if(indexOrd == 2) max_value = 100;
	else
	{
		for (var i=2; i<query.length; i+=3)
			if(max_value < parseInt(query[i])) max_value = parseInt(query[i]);
		max_value = Math.pow(2, Math.ceil(Math.log(max_value) / Math.LN2));
	}

    //manually add the first point to bottom left
    polygon_points[0] = new QPointF(this.graph_x, this.graph_y + this.graph_height);

    if (years_count > 1){
        for (var q = 0; q < (query.length / 3); q++){
            var point_x = this.graph_x + this.graph_width * (query[3*q+1] - min_year) / (years_count - 1);
            var point_y = this.graph_y + this.graph_height * (1 - query[3*q+2] / max_value);
            polygon_points[q + 1] = new QPointF(point_x, point_y);
        }
        polygon_points[(query.length / 3) + 1] = new QPointF(this.graph_x + this.graph_width, this.graph_y + this.graph_height);
    } else {
            var point_y = this.graph_y + this.graph_height * (1 - query[1] / max_value);
            polygon_points[1] = new QPointF(this.graph_x, point_y);
            polygon_points[2] = new QPointF(this.graph_x + this.graph_width, point_y);
            polygon_points[3] = new QPointF(this.graph_x + this.graph_width, this.graph_y + this.graph_height);
    }

    var poly = new QGraphicsPolygonItem(new QPolygonF(polygon_points), widget);
    poly.setPen(this.common.pen_dark);
    poly.setBrush(this.brush_gradient_up);

	for (var i=1; i<query.length; i+=3)
	{
        var point_x = this.graph_x + this.graph_width * (query[i] - min_year) / (years_count - 1);

        var line    = new QGraphicsLineItem(point_x, this.graph_y, point_x, this.graph_y + this.graph_height, poly);
        line.setPen(this.common.pen_dark);

        var txt = new QGraphicsSimpleTextItem(query[i], poly);

		var toolTip = query[i+1];
		if(indexOrd == 4)
		{
			var time = new Date(0);
			time.setMilliseconds(parseInt(query[i+1]));
			var hours = time.getHours() - 1;	//don't know why there is 1 hour too much
			var min = time.getMinutes();
			var sec = time.getSeconds();
			toolTip = (hours > 0 ? hours + ":" : "") + (min < 10 ? "0" : "") + min + ":" + (sec <10 ? "0" : "") + sec;
		}
		txt.setToolTip(toolTip);
        txt.moveBy(point_x, this.graph_y + this.graph_height);
        txt.rotate(270);
        txt.setBrush(this.common.brush_text);
    }
}
