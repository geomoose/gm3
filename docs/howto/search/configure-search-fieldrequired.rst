How-to configure a search to require a field to be completed
============================================================

Add your dataset to the ``mapbook.xml`` as a ``<map-source>``. Modify
the field names, as well as the mapfile name and location to match your
data.

::

    <map-source name="Taxlots-wfs" type="mapserver-wfs">
        <file>./demo/taxlots/taxlots.map</file>
        <param name="typename" value="ms:Taxlots" />
        <layer name="Taxlots" selectable="true" title="Taxlots">
            <template name="search"><![CDATA[
            <div class="result-item">
                <div class="result-title">
                Firestation
                </div>
                <b>Owner Name:</b> {{ properties.OwnName }}<br>
                <b>Account Number:</b> {{ properties.propertyid }}<br>
            <div>
            ]]></template>
        </layer>
    </map-source>

In the demo ``app.js`` find this section which uses the demo parcel
data:

.. code:: javascript

    app.registerService('search', SearchService, {
            fields: [
                {type: 'text', label: 'Owner Name', name: 'OWNER_NAME'},
                {type: 'text', label: 'Street/Address', name: 'OWN_ADD_L1'},
                {type: 'text', label: 'City/State/ZIP', name: 'OWN_ADD_L3'}
            ],
            searchLayers: ['vector-parcels/parcels'],
            validateFieldValues: function (fields) {
                let nonEmpty = 0;
                const validateFieldValuesResult = {
                    valid: true,
                    message: null
                };

                if (fields['OWNER_NAME'] !== undefined && fields['OWNER_NAME'] !== '') {
                        nonEmpty++;
                }
                if (fields['OWN_ADD_L1'] !== undefined && fields['OWN_ADD_L1'] !== '') {
                    nonEmpty++;
                }
                if (fields['OWN_ADD_L3'] !== undefined && fields['OWN_ADD_L3'] !== '') {
                    nonEmpty++;
                }

                if (nonEmpty === 0) {
                    validateFieldValuesResult.valid = false;
                    validateFieldValuesResult.message = 'Please complete at least one field.'
                }
                return validateFieldValuesResult;
            }
        });

Modify the fields to reference the field name in your dataset
(OWNER\_NAME), as well as the label that you want displayed (Owner
Name). If you have more than three fields to search, add another row to
the fields section and add another if statement. Modify the service name
to match your data if needed like so:

.. code:: javascript

        app.registerService('search-Taxlots', SearchService, {
            fields: [
                {type: 'text', label: 'Owner Name', name: 'OwnName'},
                {type: 'text', label: 'Situs Address', name: 'SitusAll'},
                {type: 'text', label: 'Map Taxlot', name: 'PARCELID'},
                {type: 'text', label: 'Account Number', name: 'propertyid'}
            ],
            searchLayers: ['Taxlots-wfs/Taxlots'],
            validateFieldValues: function (fields) {
                let nonEmpty = 0;
                const validateFieldValuesResult = {
                    valid: true,
                    message: null
                };

                if (fields['OwnName'] !== undefined && fields['OwnName'] !== '') {
                        nonEmpty++;
                }
                if (fields['SitusAll'] !== undefined && fields['SitusAll'] !== '') {
                        nonEmpty++;
                }
                if (fields['PARCELID'] !== undefined && fields['PARCELID'] !== '') {
                    nonEmpty++;
                }
                if (fields['propertyid'] !== undefined && fields['propertyid'] !== '') {
                    nonEmpty++;
                }

                if (nonEmpty === 0) {
                    validateFieldValuesResult.valid = false;
                    validateFieldValuesResult.message = 'Please complete at least one field.'
                }
                return validateFieldValuesResult;
            }
        });

Add the search service to the toolbar
-------------------------------------

In the ``mapbook.xml``:

1. Find the ``<toolbar>`` element.
2. Inside the ``<toolbar>`` element, add the follow entry for the new
   search service:

   .. code:: xml

       <tool name="search-Taxlots" title="Search Taxlots" type="service"/>
