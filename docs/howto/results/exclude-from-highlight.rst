How-to Exclude a Layer From Highlight
=====================================

To keep a layer from highlighting on a specific service,
add `highlight=false` to the `template` definition.


For example:

::

    <map-source ...>
        <layer ...>
            <template name="identify" highlight="false">
                ...
            </template>
        </layer>
    </map-source>

This will prevent the features from being included in the highlight
layer when found with identify.
