# Templates in GeoMoose

GeoMoose uses Mark.up templates to handle the duties of converting results to something more readable by users. More information on Mark.up and its template syntax can be found [here.](https://github.com/adammark/Markup.js/)

## General concepts

Internally, GeoMoose uses [GeoJSON](http://geojson.org/) to represent features. For rendering results from services (Identify, Select, Search) GeoMoose will take those features and use Mark.up to render them to HTML. As seen here:

<!-- {% raw %} -->
```xml
<template name="search"><![CDATA[
    <div class="search-result">
        <div class="search-label">
            {{ properties.OWNER_NAME }}
        </div>
        <div class="search-action">
            <div style="padding: 2px">
                <a onClick="app.zoomToExtent([{{ properties.boundedBy | join }}])" class="zoomto-link">
                    <i class="fa fa-search"></i>
                    {{ properties.PIN }}
                </a>
            </div>
        </div>
    </div>
]]></template>
```
<!-- {% endraw %} -->

The template above is named "search" and will be used by the search tool in order to render any features it recieves from the server.

## Aliasing templates

It is sometimes preferred to have features render the same way no matter which service is used to find them.  GeoMoose supports this by using template aliases.  For example:

<!-- {% raw %} -->
```xml
<template name="search"><![CDATA[
    <div class="parcel">
        <div class="parcel-owner">{{ properties.OWNER_NAME }}</div>
    </div>
]]></template>
<template name="identify" alias="search"/>
```
<!-- {% endraw %} -->

## Remote templates

When a Mapbook starts to grow, having all the templates inside of it can make maintenance increasingly difficult. GeoMoose supports having templates that can be downloaded only when they are needed:

<!-- {% raw %} -->
```xml
<template name="search" src="./templates/parcel-search.html"/>
```
<!-- {% endraw %} -->

Then a `./templates/parcel-search.html` file would be needed which contains the same style Mark.up template that would have otherwise  been directly in the mapbook:

<!-- {% raw %} -->
```html
<div class="search-result">
    <div class="search-label">
        {{ properties.OWNER_NAME }}
    </div>
    <div class="search-action">
        <div style="padding: 2px">
            <a onClick="app.zoomToExtent([{{ properties.boundedBy | join }}])" class="zoomto-link">
                <i class="fa fa-search"></i>
                {{ properties.PIN }}
            </a>
        </div>
    </div>
</div>
```
<!-- {% endraw %} -->

