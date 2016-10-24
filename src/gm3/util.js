/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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


/** Parse a node from XML and return the text value.
 *
 *  Handy in this situation...
 *   <map>SOME STUFF HERE</map>
 *  Specify 'map' and 'SOME STUFF HERE' will be returned
 *  by the function.  Only the first 'tag' will be found if the
 *  xml fragment has multiple, unless 'multiple' is set to true.
 *
 *  @param xml      An XML fragment.
 *  @param tagName  The tagname to return.
 *  @param multiple Whether to return an array or the first element.
 * 
 *  @returns Value of the text in the tag, or null if not found.
 */
export function getTagContents(xml, tagName, multiple) {
    // setup the array to handle multiple
    var contents = [];

    var tags = xml.getElementsByTagName(tagName);
    for(let tag of tags) {
        var node_value = null;
        for(let child of tag.childNodes) {
            // text type node is nodeType == 3
            if(child.nodeType == 3) {
                if(node_value == null) {
                    node_value = '';
                }
                node_value += child.nodeValue;
            }
        }

        // when multiple is not true, return the first value.
        if(multiple === true) {
            contents.push(node_value);
        } else {
            return node_value;
        }
    }

    return contents;
}

/** Compare two objects
 * 
 *  @param objA The first object
 *  @param objB The second object
 *  @param deep Whether to go "deeper" into the object.
 *
 *  @returns boolean, true if they differ, false if they are the same.
 */
export function objectsDiffer(objA, objB, deep) {
    let a_keys = Object.keys(objA), b_keys = Object.keys(objB);

    for(let key of a_keys) {
        let b_type = typeof(objB[key]);
        switch(b_type) {
            // if the key from a does not exist in b, then they differ.
            case 'undefined':
                return true;
            // standard comparisons
            case 'string':
            case 'number':
                if(objA[key] != objB[key]) {
                    return true;
                }
            // GO DEEP!
            case 'object':
                // typeof(null) == 'object', this
                //  prevents trying to recurse on null
                if(objB[key] == null) {
                    if(objA[key] != null) {
                        return true;
                    }
                }
                if(deep === true && objectsDiffer(objA[key], objB[key], true)) {
                    return true;
                }
        }
    }

    // The above loop ensures that all the keys
    //  in "A" match a key in "B", if "B" has any 
    //  extra keys then the objects differ.
    for(let key of b_keys) {
        if(a_keys.indexOf(key) < 0) {
            return true;
        }
    }
        
    return false;
}
