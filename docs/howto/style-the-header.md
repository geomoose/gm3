# How-to style the header

This how-to assumes making changes to the GeoMoose desktop example.

## Changing the logo

The logo is included as a basic `<img>` tag in the HTML.  To change it find this line in `index.html`:

```html
<img height="50" src="logo.png">
```

Then change the `src` attribute to an appropriate url for the desired logo.

## How to change the header background

The default background is an attractive medium grey but its not everyone's preferred hue. The background can be changed by adding the following CSS:

```css
#header {
    background-color: darksteelblue;
}
```

`darksteelblue` can be changed with any CSS definition.

### With a background image
A color could easily be substituted with an image, such as this desirable granite pattern:
```css
#header {
    background-image: url(https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Granite_Yosemite_P1160483.jpg/320px-Granite_Yosemite_P1160483.jpg);
}
```
