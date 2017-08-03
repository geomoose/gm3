# How-to customize tabs

Unlike GeoMoose versions 1 and 2, tabs are no longer special, heavily
managed Javascript classes.  Tabs are now regular HTML and most elements 
of the GeoMoose user interface can be placed anywhere in the page.

## Example 1: Rename the Super tab to Results

In `index.html`, find the `<span>` with the id `service-tab-tab`. Change
the contents from `Super` to `Results`. 

That's it!

## Example 2: Removing the Visible tab

While some find the concept of a 'Visible' or 'Active' layers list to be
useful, a smaller catalog or more limited version of the application would 
not need such a feature.  

1. Open `index.html` and find `visible-layers-tab`.
2. Then find the `<div>` with id `visible-layers` and remove it.
3. Now open `app.js` and remove this line (approx. line 83):

```javascript
app.add(gm3.components.VisibleLayers, 'visible-layers');
```

