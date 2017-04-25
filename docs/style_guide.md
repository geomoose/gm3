# GeoMoose 3 Style Guide

## For any and all files

* No hard tabs. This is further explained in the library development which is properly linted.

## For GeoMoose application development

As GeoMoose application development is really an exercise left for the administrator/installer, 
there is not a strict style guide for development.  Best practices and styles for application 
development can therefore work within the framework of the installer's organization.

## For Library Development

GeoMoose provides an `eslint` set of styles that will check-code before publishing.
The `eslintrc` will provide for both the evolving and enforced coding style.  Code that does
not lint will be rejected from merges.

This is a summary of changes and is inspired by the [AirBnB Javascript Style Guide](https://github.com/airbnb/javascript).


* GeoMoose 3 uses ES6/ES2015 styles. Generally:
   * Use Classes and Modules using Es6 style.
   * import and export should be used.
* No hard tabs. Please use "4 space" tabs.  In VIMspeak:
    ```
    autocmd BufRead,BufNewFile,BufEnter */GeoMOOSE/gm3/* :setlocal expandtab ts=4 sts=4 sw=4
    ```
* Avoid `var`.  Prefer `const` and `let`, `var` creates scoping and localization issues solved by `let` and `const`.  `const` provides static checking as well.
* Use literal syntaxes for creating objects and Arrays.  (e.g. `{}` and `[]` not `new Object` and `new Array`)
* Do not use `"` for object properties unless they are invalid property names.
* Prefer single quotes for strings.
```
    const name = "bad";
   
    const name = 'good';
```
    
* Do not break long strings across newlines.  This makes the code harder to search.
* Naming conventions:
    * Classes: UpperCaseClassNames
	* Methods and Functions: shouldBeCamelCased
	* Method and Function Parameters:  alsoCamelCased 
```
    function mySuperDuperFunction(parameterA, secondParameter) {
      
    }
```
  * Local variables: should_be_undercase_delimited

* Comments
    * Comments before declarations should use `/* */` and follow Doxygen style.
    * Comments inside of code blocks should use `//` and be on the line BEFORE not inline or after.

### Regarding CSS/LESS

* The demo application in `demo/` CSS may have *id* referenced elements.  Referencing elements by ID is generally done for layout purposes.
* The LESS files *should never* refer to an element by ID.  The LESS files are to provide styling for *components only.*


