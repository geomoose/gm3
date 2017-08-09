# How-to style the toolbar

Want to change the styling for a toolbar icon? No problem! GeoMoose was written in order to provide easy-to-override CSS. Making it easy to change icons, colours, and other styles without writing any code!


## Getting started

When starting from the GeoMoose desktop example there are two css files already included `geomoose.css` and `app.css`.  It is recommeneded to create another css file, `site.css` which will contain all of your site-specific customizations.  More advanced users may have more heavily customized the application, in which case this guide should still be helpful in understanding the styling of tools.


`site.css` can be added to the html by adding the following line to the HTML file's `<head>` section:
```xml
<link rel="stylesheet" type="text/css" href="site.css"/>
```

## How to remove all toolbar labels

In `site.css` add:
```css
.toolbar .tool .label {
    display: none
}
```

## How to change all tool colors

In `site.css` add:
```css
.toolbar .tool {
	color: red;
}
```

## Styling an individual tool in the toolbar

This example refers to the identify tool which is defined in the mapbook as follows:

```xml
<tool name="identify" title="Identify" type="service"/>
```

The `name` attribute of the tool is added to the CSS classes. This gives a direct mapping between what is in the Mapbook and what is seen in the application.

### Remove the label from one tool

This is _very_ similar to what is seen above with removing icons from all the tools in the toolbar.  The critical part is changing `.tool` to `.tool.identify`.  There is no space between `.tool` and `.identify`.

```css
.toolbar .tool.identify .label {
	display: none
}
```

### Changing the color of one tool

```css
.toolbar .tool.identify {
	color: steelblue;
}
```

## Icon customization

GeoMoose uses webfonts to define icons.  Two are included by default:

* [Font Awesome](http://fontawesome.io/icons/)
* [MapSkin](http://mapsk.in/)

This means using the CSS `before` selector to change the icon.

### Change the icon using webfonts

**Using a FontAwesome icon:**
```css
/* first change the icon font to FontAwesome */
.toolbar .tool.identify .icon {
	font: normal normal normal 14px/1 FontAwesome;
}

/* then change the icon */
.toolbar .tool.identify .icon:before {
	/* This is the "eye dropper" */
	content: "\f1fb";
}
```

**Using a MapSkin icon:**
```css
/* first change the icon font to mapskin */
.toolbar .tool.identify .icon {
	font: normal normal normal 14px/1 mapskin;
}

/* then change the icon */
.toolbar .tool.identify .icon:before {
	/* This is the "label" */
	content: "\e087";
}
```

### Change the icon color

This works for any webfont based icon!

```css
.toolbar .tool.identify .icon {
	/* This make the identify icon yellow. */
	color: #ffff00;
}
```

### Change the icon to an image

Don't love the webfont options? Have something hanging around you'd like to use? This example uses the GeoMoose favicon.  The URL can be replaced with any image end-point.

```css
/* disable the webfont icon */
.toolbar .tool.identify .icon:before {
    content: '';
}

/* use an image file icon */
.toolbar .tool.identify .icon {
    /* since this icon has no content, the size needs to be set */
    width: 1em;
    height: 1em;
    /* this ensures the entire icon will fit inside the width, height */
    box-sizing: border-box;
    /* URL to the icon image. */
    background-image: url(https://github.com/geomoose/geomoose-art/raw/master/logo_2011/favicon/favicon-32.png);
    /* prevent the icon image from repeating. */
    background-repeat: no-repeat;
    /* ensure the background fits inside the icon */
    background-size: 1em;
}
```



