/** Collection of handy functions
 */

export function parseBoolean(bool, def=false) {
	if(typeof(bool) == "undefined") { return def; }
	var boolString = new String(bool);
	if(boolString.match(/true/i)) { return true; }
	else if(boolString == '1') { return true; }
	else if(boolString.match(/on/i)) { return true; }
	return false;
}

