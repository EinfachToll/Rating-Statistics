Importer.include("favourites.js");
Importer.include("pixmap_cache.js");

function StatisticsWindow()
{
    QMainWindow.call( this, null );
    this.windowTitle = qsTr("Rating Statistics");

    this.mainTabWidget       = new QTabWidget();
    this.favouritesWidget    = new QWidget();
    this.configurationWidget = new QWidget();
    this.favouritesTab       = new FavouritesTab();
         
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

