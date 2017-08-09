# How-to create a custom print layout

GeoMoose uses jsPDF to perform client-side generation of PDF printouts.
It has four built-in templates but they are relatively plain and may
not be for everyone.

## What is in a print layout

A print layout is comprised of a label, orientation, page size,
unit specification, and a list of page elements. These are defined
as a Javascript object which can be passed to the PrintModal component.

## The default configuration

In the desktop example application, the PrintModal uses its built-in
layouts but is defined in this way:

```javascript
 var print_preview = app.add(gm3.components.PrintModal, 'print-preview', {});
```

## Adding a custom layout

To override the default layouts the layouts need to be configured
for the PrintModal:

<!-- {% raw %} -->
 ```javascript

var custom_layouts = [
  {
    label: 'Landscape Letter',
    orientation: 'landscape',
    page: 'letter',
    units: 'in',
    elements: [
        {
            type: 'text',
            size: 18, fontStyle: 'bold',
            x: .5, y: .70, text: '{{title}}'
        },
        {
            type: 'map',
            x: .5, y: .75,
            width: 10, height: 7
        },
        {
            type: 'rect',
            x: .5, y: .75,
            width: 10, height: 7,
            strokeWidth: .01
        },
        {
            type: 'text',
            x: .5, y: 8, text: 'Printed on {{month}} / {{day}} / {{year}}'
        }
    ]
  }
];

 var print_preview = app.add(gm3.components.PrintModal, 'print-preview', {
   layouts: custom_layouts
 });
```
<!-- {% endraw %} -->

`custom_layouts` contains:
* `label` - The name of this layout presented to the user in the Print Preview dialog.
* `orientation` - Page orientation.  One of `'landscape'` or `'portrait`'.
* `page` - The page size (as supported by [usejsdoc.org]).  e.g. `'letter'`, `'a4'`, ...
* `units` - The units used to specify the position of elements (e.g. for `x`,`y`,`width`,`height`,`strokeWidth`,...).  Can any units supported by jsDoc including: `'in'`, `'mm'`, `'pt'`.
* `elements` - An array of elements, described below.

The following elements are available:

* `text` - Puts text on the map.
  * `text` - The content to put on the map.
    Supports [GeoMoose Templates](../templates.md) including a special `{{title}}`
    mustasche which is the user's inputed title.
  * `size` - The font size in points.
  * `fontStyle` - `normal`, `italic` or `bold`
  * `font` - Defaults to Arial but could be any common font available to the browser.
  * `color` - Array of 0-255 of `[r, g, b]`.
* `map` - Put the map on the PDF.
  * `x` - The left-most side of the map.
  * `y` - The top most side of the map.
  * `width` - The width of the map.
  * `height` - The height of the map.
* `rect`, `ellipse` - Either shape can be drawn on the PDF.
  * `x`, `y` - Define the upper left corner of the shape.
  * `fill` - Array of 0-255 of `[red, green, blue]`. Filled color of the shape.
  * `stroke` - Array of 0-255 of `[red, green, blue]`. Outline color of the shape.
  * `width`, `height` - `rect`-only the width and height of the rectangle.
  * `rx`, `ry` - `ellipse`-only, specifies the x and y radii of the ellipse.
* `image` - Add an image to the map.
  * `data` - The bytes defining the image.
  * `x`, `y` - Define the upper left corner of the image.
  * `width`, `height` - The width and height of the image in the map (optional).
