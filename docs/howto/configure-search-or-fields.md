# How-to Configure "or" type Search

## Allow any matching field.

The following change will match any field. For example, it will match both the OWNER_NAME field and the OWN_ADD_L1 field if they both contain search terms.

In the `app.js` configuration after:
```
    app.registerService('search', SearchService, {
        fields: [
            {type: 'text', label: 'Owner Name', name: 'OWNER_NAME'},
            {type: 'text', label: 'Street/Address', name: 'OWN_ADD_L1'},
            {type: 'text', label: 'City/State/ZIP', name: 'OWN_ADD_L3'}
        ],
```

Add the following:
```
        prepareFields: function (fields) {
            // reformat the fields for the query engine,
            //  "*stuff*" will do a case-ignored "contains" query.
            var query = ['or'];
            for(var i = 0, ii = fields.length; i < ii; i++) {
                if(fields[i].value !== '' && fields[i].value !== undefined) {
                    query.push({
                        comparitor: 'ilike',
                        name: fields[i].name,
                        value: '%' + fields[i].value + '%'
                    });
                }
            }
            return [query];
        },

```

### Testing in the demo

Use 'Little' in the 'Owner Name' field and 'Blaine' in the 'Street/Address' field. This should return both parcels with 'Little' in the 'Owner Name' and who live on 'Blaine'.

## Use a single field to search many

Many users are accustomed to search utilities which allow for a single search term to search multiple fields. GeoMoose supports that with the follow change:

```
    app.registerService('search', SearchService, {
        // The input fields are defined only using one field
        fields: [
            {type: 'text', label: 'Search', name: 'TERM'},
        ],
        prepareFields: function (fields) {
            // this pulls out the term from the search
            const searchTerm = fields[0].value;
            // this is the list of fields in the layer which will be searched.
            const searchFields = ['OWNER_NAME', 'OWN_ADD_L1', 'OWN_ADD_L2'];
            // this switched to matching any field
            var query = ['or'];
            for(var i = 0, ii = searchFields.length; i < ii; i++) {
                query.push({
                    comparitor: 'ilike',
                    name: searchFields[i],
                    value: '%' + searchTerm + '%'
                });
            }
            return [query];
        },
        searchLayers: ['vector-parcels/parcels']
    });
```

## Testing in the demo

Search using the term 'ant'. There will be owners with 'ant' in their name and streets which include 'ant' in the street name.

## Search with a list

There are cases in which using a list of features is easier than using terms. For example, getting a list of parcels from an external application and searching for that list of parcels.

```
    app.registerService('search', SearchService, {
        fields: [
            {type: 'text', label: 'PINs', name: 'TERM'},
        ],
        prepareFields: function (fields) {
            const searchTerm = fields[0].value;
            // The replace will clean up any whitespace
            // The split converts the list to an array.
            const pinList = searchTerm.replace(' ', '').split(',');

            // this is the list of fields in the layer which will be searched.
            // Warning! Adding a list of fields here can make the search very slow!
            const searchFields = ['PIN'];
            var query = ['or'];
            // search each field with the list of pins.
            for (var f = 0, ff = searchFields.length; f < ff; f++) {
                for(var i = 0, ii = pinList.length; i < ii; i++) {
                    query.push({
                        comparitor: 'eq',
                        name: searchFields[f],
                        value: pinList[i]
                    });
                }
            }
            return [query];
        },
        searchLayers: ['vector-parcels/parcels']
    });
```

### Testing in the demo

Search using the following list: `350010001079, 070030004077, 163030001000, 160050008003`.
