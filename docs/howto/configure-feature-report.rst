Configuring the Feature Report
==============================

The feature report generates a printable PDF for a queried feature (for
example, a parcel report) or for an entire result set. It reuses the whole
print pipeline -- layouts, scale selection, the georeferenced map image,
fonts -- and adds two things on top:

* the feature's attributes are available to every text element, and
* a ``table`` element can be bound to the feature or to the results set
  instead of carrying literal rows.

Adding the report component
---------------------------

The report renders in its own modal, added alongside the print modal in
``app.js``:

::

    app.add(gm3.components.ReportModal, 'report-preview', {});

with a matching element in the page:

::

    <div id="report-preview"></div>

Opening a report
----------------

Two application methods open a report:

* ``app.showFeatureReport(layerPath, filter, options)`` - a report for a
  single feature. ``filter`` is the same predicate-array form used by
  ``removeQueryResults``, e.g. ``[['==', 'PIN', '12345']]``. The map is
  zoomed to the feature first, so the report's map image is centered on
  it; pass ``{zoomToFeature: false}`` to skip that.
* ``app.showResultsReport(layerPath)`` - a report covering every result
  currently in the layer.

The usual place to call the first one is a results-row template, next to
the existing zoom/remove/buffer actions:

::

    <a
      title="Feature report"
      onClick="app.showFeatureReport('vector-parcels/parcels', [['==', 'PIN', '{{ properties.PIN }}']])"
    >
      <i class="icon report"></i>
    </a>

The results grid renders its own report button, which calls
``showResultsReport`` for the displayed layer -- no configuration needed.

.. note::

    The report resolves its feature from the live query results rather
    than from a copy, so a report always reflects the current selection.

Defining the layout
-------------------

A layer's report layout is a ``report`` template on the layer in the
mapbook:

::

    <layer name="parcels">
        <template name="select-grid-columns" src="./templates/parcel-columns.json" />
        <template name="select-grid-row" src="./templates/parcel-row.html" />
        <template name="identify" src="./templates/parcels.html" />

        <template name="report" src="./templates/parcel-report.json" />
    </layer>

The template contains a print layout, or an array of them, in exactly the
form described in :doc:`print-layouts`. When a layer has no ``report``
template, a built-in default layout is used: a title, the map, and a
table listing every attribute of the feature.

Which layout is used is chosen automatically from how the report was
opened -- a layout whose table is bound to ``results`` for a results
report, otherwise a feature layout. This is why the print dialog's layout
picker is not shown in the report dialog.

Binding a table to the data
---------------------------

Inside a report layout, a ``table`` element gains three settings:

* ``data`` - ``feature`` (the subject feature) or ``results`` (every
  feature in the result set). Defaults to whichever mode the report was
  opened in.
* ``transpose`` - Boolean. Instead of one row per feature, emit one
  label/value row per field. This is the usual shape for a single-feature
  report.
* ``columns`` - In addition to the inline array described in
  :doc:`print-layouts`, this may be the *name* of one of the layer's JSON
  templates (``"select-grid-columns"`` is the common choice, so the report
  matches the results grid). Omit it entirely to list every attribute of
  the feature.

  Each column definition is ``{property, title, width, align, format}``.
  ``property`` is required -- columns without one (an actions column, say)
  are dropped. ``format`` is a :doc:`GeoMoose Template <../templates>`
  evaluated against the feature, which is how a raw value becomes a
  formatted one:

  ::

      {"property": "EMV_TOTAL", "title": "Value", "align": "right",
       "format": "${{ properties.EMV_TOTAL | number | localize }}"}

A transposed table also takes ``labelTitle``, ``valueTitle``,
``labelWidth``, and ``valueAlign`` to control its two columns.

Feature attributes in text
--------------------------

Text elements in a report layout can reference the subject feature's
attributes directly, either bare or through ``properties``:

::

    {"type": "text", "size": 18, "fontStyle": "bold", "x": 0.5, "y": 0.7,
     "text": "Parcel Report: {{properties.PIN}}"}

The reserved print mustaches (``{{title}}``, ``{{month}}``, ``{{day}}``,
``{{year}}``, ...) take precedence over an attribute of the same name.

Titling the report
------------------

A report is usually titled from the feature it describes rather than by
the user. Give the layout a ``title`` and it becomes the default, used
whenever the user leaves the title box empty:

::

    {
        "label": "parcel-report",
        "title": "Parcel Report: {{properties.PIN}}",
        "elements": [
            {"type": "text", "size": 18, "fontStyle": "bold",
             "x": 0.5, "y": 0.7, "text": "{{title}}"}
        ]
    }

The user still sees the title box -- with the resolved default as its
placeholder -- and anything they type replaces the default for that
report. To title the report from the feature and *not* let the user
change it, add ``"allowTitleOverride": false`` and the box is hidden.

Writing the heading as a literal ``"Parcel Report: {{properties.PIN}}"``
text element works too, but the user's title is then silently discarded,
which is the behavior ``title`` exists to avoid.

Measuring the reported feature
------------------------------

Set ``showMeasurements`` on the layout to annotate the subject feature on
the report's map image the same way the measure tool does: the feature is
outlined in the measure style, each segment labeled with its length, and
the polygon labeled with its area.

::

    {
        "label": "parcel-report",
        "orientation": "portrait",
        "page": "letter",
        "units": "in",
        "showMeasurements": true,
        "areaUnits": "a",
        "elements": [ ... ]
    }

``lengthUnits`` and ``areaUnits`` set the units the annotations render in
and both default to ``ft``. They accept the same values as the measure
tool (see :doc:`configure-measure-tool`) -- above, ``"a"`` labels the
parcel's area in acres while the segments stay in feet.

These annotations exist only on the printed map. They are never added to
the interactive map's state, so opening a report does not disturb whatever
the user was measuring.

A complete example
------------------

``examples/desktop/templates/parcel-report.json`` defines both layouts for
the desktop example's parcel layer: a single-parcel report with a
transposed attribute table and on-map measurements, and a results report
with one row per parcel.
