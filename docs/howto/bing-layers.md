# How-to add Bing layers

## Step 1: Get a Bing key

Bing services require having a registered API key. 
[Click Here](https://msdn.microsoft.com/en-us/library/ff428642.aspx) to get a key.


## Step 2: Add a bing-type map-source

The following should be added as the last `map-source` entry in the `mapbook.xml` file.

```xml
<map-source name="bing" type="bing">
    <layer name="roads"/>
    <layer name="aerials"/>
    <param name="key" value="'Your Key Here'"/>
</map-source>
```

## Step 3: Add your API key

The XML snippet above features the string `'Your Key Here'` that string sould
be replaced with the API key obtains from Bing.

## Step 4: Add the Bing layer to the catalog

If working from the demo's catalog, then the Bing layers can simply be uncommented. 
If working from an original mapbook, add the following to the `<catalog>` section
of the mapbook:

```xml
<layer title="Bing Roads" src="bing/roads" show-legend="false" legend="false" fade="true" unfade="true"/>
<layer title="Bing Aerials" src="bing/aerials" show-legend="false" legend="false" fade="true" unfade="true"/>
```
