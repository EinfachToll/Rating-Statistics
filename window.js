Importer.include("favourites.js");
Importer.include("display_common.js");
Importer.include("pixmap_cache.js");

function StatisticsWindow()
{
    QMainWindow.call( this, null );
    this.windowTitle = qsTr("Rating Statistics");

    this.mainTabWidget       = new QTabWidget();
    this.favouritesWidget    = new QWidget();
    this.configurationWidget = new QWidget();
    this.displayCommon       = new DisplayCommon();
    this.favouritesTab       = new FavouritesTab(this.displayCommon);
         
    config.draw(this.configurationWidget);
    config.showConfiguration();
    this.favouritesTab.draw(this.favouritesWidget);

	this.mainTabWidget.documentMode = true;
    this.mainTabWidget.addTab(this.favouritesWidget, qsTr("Favourites"));
    this.mainTabWidget.addTab(this.configurationWidget, qsTr("Configuration"));

	config.buttonBox.clicked.connect(this,this.applyPressed);

    this.setCentralWidget(this.mainTabWidget);
}

StatisticsWindow.prototype = new QMainWindow();

StatisticsWindow.prototype.applyPressed = function()
{
	config.onConfigurationApply();
	this.mainTabWidget.setCurrentIndex(0);
	this.favouritesTab.onQuerySubmitted();
};

StatisticsWindow.prototype.closeEvent = function(CloseEvent)
{
    for (var i=0; i<2; i++){ tabWidget.removeTab(0); }
    CloseEvent.accept();
    msg("Closing");
};

StatisticsWindow.prototype.resizeEvent = function(ResizeEvent)
{
//    msg("resizing...");
//    this.displayCommon.changeFrameWidth(ResizeEvent.size().width() - 64);
//    msg("graph painter");
//    this.favouritesTab.graphPainter = new GraphPainter(this.displayCommon);
//    this.favouritesTab.onQuerySubmitted();
};

