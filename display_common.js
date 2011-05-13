Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

Importer.include("display_frame.js");

function DisplayCommon()
{
    msg("Initializing common colors, brushes, gradients etc...");

    // Fonts
    this.font                       = new QFont(QApplication.font().family(), QApplication.font().pointSize());
    this.font_metrics               = new QFontMetrics(this.font);
    this.font_height                = this.font_metrics.height();
    this.font_bold                  = new QFont(QApplication.font().family(), QApplication.font().pointSize() + 2, Qt.Bold);
    this.font_bold_metrics          = new QFontMetrics(this.font_bold);
    this.font_bold_height           = this.font_bold_metrics.height();
    // Dimensions
    this.frame_x                    = 380;
    this.frame_y                    = 96;
    this.frame_spacing              = 5;
    this.albumCover_x               = 80;
    this.albumCover_y               = 80;
    this.albumCover_spacing         = 4;
    this.text_spacing               = 2;
    this.text_thickness             = 4;
    this.text_y                     = 24;
    this.weightIndicator_thickness  = 1;
    this.weightIndicator_y          = this.frame_y - this.albumCover_y - (3 * this.albumCover_spacing);
    // Colors
    this.color_mid                  = QApplication.palette().color(QPalette.Mid);
    this.color_button               = QApplication.palette().color(QPalette.Button);
    this.color_dark                 = QApplication.palette().color(QPalette.Dark);
    this.color_text                 = QApplication.palette().color(QPalette.Text);
    // Brushes
    this.brush_solid_dark           = new QBrush(this.color_dark);
    this.brush_text                 = new QBrush(this.color_text);
    // Pens
    this.pen_dark                   = new QPen(this.color_dark);
    this.pen_mid                    = new QPen(this.color_mid);

    this.refreshGradients();

    msg("done.");
}

DisplayCommon.prototype.refreshGradients = function()
{
    this.gradient_streight          = new QLinearGradient( new QPointF(0, 0), new QPointF(this.frame_x * 1.5, 0));
    this.gradient_reversed          = new QLinearGradient( new QPointF(0, 0), new QPointF(this.frame_x * 1.5, 0));
    this.gradient_streight.setColorAt(0, this.color_mid);
    this.gradient_streight.setColorAt(1, this.color_button);
    this.gradient_reversed.setColorAt(0, this.color_button);
    this.gradient_reversed.setColorAt(1, this.color_mid);
    this.brush_gradient_streight    = new QBrush(this.gradient_streight);
    this.brush_gradient_reversed    = new QBrush(this.gradient_reversed);
}

DisplayCommon.prototype.changeFrameWidth = function(newWidth)
{
    this.frame_x            = newWidth;
    this.refreshGradients();
}

DisplayCommon.prototype.drawFrame = function(scrollArea, frame_id)
{
    var frame    = new Frame(0, 0, 0, 0, 0, 0, 0);
    frame.id     = frame_id
    frame.x      = 0;
    frame.y      = frame.id * (this.frame_y + this.frame_spacing) + this.frame_spacing;
    frame.width  = this.frame_x;
    frame.height = this.frame_y;
    frame.pen    = this.pen_dark;
    frame.brush  = (frame.id % 2 == 0) ? this.brush_gradient_streight : this.brush_gradient_reversed;

    frame.widget = scrollArea.addRect(frame.x, frame.y, frame.width, frame.height, frame.pen, frame.brush);
    scrollArea.sceneRect = new QRectF(0, 0, frame.x + frame.width, frame.y + frame.height + this.frame_spacing);

    return frame;
}

DisplayCommon.prototype.addAlbumCover = function(frame, image_filepath)
{
    var pixmap = new QPixmap(image_filepath).scaled(this.albumCover_x ,this.albumCover_y, Qt.KeepAspectRatio, Qt.SmoothTransformation);
    var img    = new QGraphicsPixmapItem(pixmap, frame.widget);

    img.moveBy(frame.x + this.albumCover_spacing + (this.albumCover_x - pixmap.width()) / 2, frame.y + this.albumCover_spacing + (this.albumCover_y - pixmap.height()) / 2);
}

DisplayCommon.prototype.addWeightRating = function(frame, weight, max_weight)
{
    var weight_frame = new QGraphicsRectItem(
        frame.x + this.albumCover_spacing,
        frame.y + this.albumCover_y + 2 * this.albumCover_spacing,
        this.albumCover_x,
        this.weightIndicator_y,
        frame.widget
    );
    var weight_value = new QGraphicsRectItem(
        frame.x + this.albumCover_spacing + this.weightIndicator_thickness,
        frame.y + this.albumCover_y + 2 * this.albumCover_spacing + this.weightIndicator_thickness,
        (this.albumCover_x - 2 * this.weightIndicator_thickness) * (weight / max_weight),
        this.weightIndicator_y - 2 * this.weightIndicator_thickness,
        frame.widget
    );
    weight_value.setPen(this.pen_dark);
    weight_value.setBrush(this.brush_solid_dark);
}

DisplayCommon.prototype.addSimpleText = function(frame, text, y, big_font)
{
    if (big_font == false){
        font = this.font;
    } else {
        font = this.font_bold;
    }

    font_metrics = new QFontMetrics(font);

    var edited = false;
    var max_text_width = (frame.width - this.albumCover_x - 2 * this.albumCover_spacing - 2 * this.text_thickness) * 0.95;

    for (var w = font_metrics.size(0, text, 0, 0).width(); w > max_text_width; w = font_metrics.size(0, text, 0, 0).width()){
        text = text.substr(0, text.length - 1);
        edited = true;
    }

    if (edited == true){text = text + "...";}

    var txt = new QGraphicsSimpleTextItem(text, frame.widget);


    txt.moveBy(frame.x + this.albumCover_x + 2 * this.albumCover_spacing + this.text_thickness,
               frame.y + this.text_thickness + y);
    txt.setBrush(this.brush_text);

    if (big_font == true){
        txt.setFont(this.font_bold);
    }
}




