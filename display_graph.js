Importer.include("display_common.js");
Importer.include("display_frame.js");

function GraphPainter(displayCommon)
{
    this.common = displayCommon;

    this.frame_width                = this.common.frame_x;
    this.frame_height               = this.common.frame_y * 3;
    this.frame_thickness            = 10;
    this.vertical_labels_width      = 0;
    this.vertical_labels_border     = 0;
    this.horizontal_labels_height   = 0;
    this.horizontal_labels_border   = 0;

    this.vertical_labels_x          = 0 + this.frame_thickness;
    this.vertical_labels_y          = 0 + this.frame_thickness;

    this.graph_x                    = 0 + this.frame_thickness + this.vertical_labels_width + 2 * this.vertical_labels_border;
    this.graph_width                = this.frame_width - this.frame_thickness - this.graph_x;

    this.horizontal_labels_x        = this.graph_x;
    this.horizontal_labels_y        = this.frame_height - this.frame_thickness - this.horizontal_labels_border - this.horizontal_labels_height;

    this.graph_y                    = 0 + this.frame_thickness;
    this.graph_height               = this.frame_height - 2 * this.horizontal_labels_border - this.horizontal_labels_height - this.frame_thickness;

    this.gradient_up = new QLinearGradient( new QPointF(0, 3 * this.common.frame_y), new QPointF(0, 0));
    this.gradient_up.setColorAt(0, this.common.color_dark);
    this.gradient_up.setColorAt(1, this.common.color_button);
    this.brush_gradient_up = new QBrush(this.gradient_up);
    msg("GraphPainter initialized.");
}

GraphPainter.prototype.drawGraph = function(scrollArea, query, maxValue)
{
    msg("painting graph...");

    var widget = scrollArea.addRect(0, 0, this.frame_width, this.frame_height, this.common.pen_mid, this.common.brush_solid_dark);
    scrollArea.sceneRect = new QRectF(0, 0, this.frame_width, this.frame_height);

    var min_year       = query[0];
    var max_year       = query[query.length - 2];
    var years_count    = max_year - min_year + 1;
    var polygon_points = new Array();

    //manually add the first point to bottom left
    polygon_points[0] = new QPointF(this.graph_x, this.graph_y + this.graph_height);

    if (years_count > 1){
        for (var q = 0; q < (query.length / 2); q++){
            var point_x = this.graph_x + this.graph_width * (query[2*q] - min_year) / (years_count - 1);
            var point_y = this.graph_y + this.graph_height * (1 - query[2*q + 1] / maxValue);
            polygon_points[q + 1] = new QPointF(point_x, point_y);
        }
        polygon_points[(query.length / 2) + 1] = new QPointF(this.graph_x + this.graph_width, this.graph_y + this.graph_height);
    } else {
            var point_y = this.graph_y + this.graph_height * (1 - query[1] / maxValue);
            polygon_points[1] = new QPointF(this.graph_x, point_y);
            polygon_points[2] = new QPointF(this.graph_x + this.graph_width, point_y);
            polygon_points[3] = new QPointF(this.graph_x + this.graph_width, this.graph_y + this.graph_height);
    }

    var poly = new QGraphicsPolygonItem(new QPolygonF(polygon_points), widget);
    poly.setPen(this.common.pen_dark);
    poly.setBrush(this.brush_gradient_up);

    var years_stride = (years_count > 15) ? 5 : (years_count > 5) ? 3 : 1;

    for (var i = 0; i < years_count; i += years_stride){
        var point_x = this.graph_x + this.graph_width * (i / years_count);

        var line    = new QGraphicsLineItem(point_x, this.graph_y, point_x, this.graph_y + this.graph_height, poly);
        line.setPen(this.common.pen_dark);

        var txt = new QGraphicsSimpleTextItem(""+(parseInt(min_year) + parseInt(i)), poly);
        txt.moveBy(point_x, this.graph_y + this.graph_height);
        txt.rotate(270);
        txt.setBrush(this.common.brush_text);
    }
}



