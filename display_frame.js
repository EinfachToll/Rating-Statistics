Importer.loadQtBinding( "qt.gui" );
Importer.loadQtBinding( "qt.uitools" );

function Frame(top_x, top_y, width, height, pen, brush)
{
    this.x      = top_x;
    this.y      = top_y;
    this.width  = width;
    this.height = height;
    this.pen    = pen;
    this.brush  = brush;
    this.widget = 0;
}