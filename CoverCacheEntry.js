
function CoverCacheEntry(path, is_cached, size)
{
	this.path      = path;
	this.is_cached = is_cached;
	this.size      = size;	
};

CoverCacheEntry.prototype.is_small = function()
{
	if (this.is_cached == false){
		return false;
	}
	
	return (this.size < 80);
};

CoverCacheEntry.extract_size = function(path)
{
	return path.substring(0, path.indexOf("@"));
};
