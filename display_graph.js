Importer.include("utils.js");

function GraphPainter()
{
};

GraphPainter.prototype.drawGraph2 = function(scrollArea, result, indexOrd, indexGr)
{
    Amarok.debug("painting flot");
    
    var html = read_local_file("/queries/graph_years.html"); // FIXME
    var jquery = read_local_file(filesystem.js_jquery);   
    var flot = read_local_file(filesystem.js_flot);
    
    scrollArea.setHtml(html, new QUrl(Amarok.Info.scriptPath()));
    scrollArea.show();
    
    scrollArea.page().mainFrame().evaluateJavaScript(jquery);
    scrollArea.page().mainFrame().evaluateJavaScript(flot);
       
    var data = "";    
    while (result.read_next()) {
        data += "[" + result.get('year') + "," + result.get('weight') + "],";
    };
    
    var script = "var d = [" + data + "]; $.plot($('#graph'), [d]);";
    scrollArea.page().mainFrame().evaluateJavaScript(script);
        
    Amarok.debug("done!");
};