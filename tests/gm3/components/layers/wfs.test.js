/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2019 Dan "Ducky" Little
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as proj from "ol/proj";

import { buildWfsQuery } from "gm3/components/map/layers/wfs";

const PARCELS_SRC = {
  layers: [{}],
  params: {
    MAP: "/demo/parcels/parcels.map",
    typename: "ms:parcels",
  },
  type: "wfs",
  urls: ["/mapserv"],
};

describe("WFS Testing", () => {
  it("Test creating a query with on input", () => {
    const basicQuery = {
      fields: [
        {
          comparitor: "eq",
          name: "OWNER_NAME",
          value: "peterson",
        },
      ],
      layers: ["vector-parcels/parcels"],
    };

    const outputFormat = "text/xml; subtype=gml/2.1.2";
    const wfsQueryXml = buildWfsQuery(
      basicQuery,
      PARCELS_SRC,
      new proj.get("EPSG:3857"),
      outputFormat
    );

    expect(wfsQueryXml).toBe(
      '<GetFeature xmlns="http://www.opengis.net/wfs" service="WFS" version="1.1.0" outputFormat="text/xml; subtype=gml/2.1.2" xmlns:ns1="http://www.w3.org/2001/XMLSchema-instance" ns1:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"><Query typeName="ms:parcels" srsName="EPSG:3857"><Filter xmlns="http://www.opengis.net/ogc"><PropertyIsEqualTo><PropertyName>OWNER_NAME</PropertyName><Literal>peterson</Literal></PropertyIsEqualTo></Filter></Query></GetFeature>'
    );
  });

  it("Tests creating a query with TWO inputs (defaults to AND)", () => {
    const fields = [
      {
        comparitor: "eq",
        name: "OWNER_NAME",
        value: "peterson",
      },
      {
        comparitor: "gt",
        name: "ACRES",
        value: "5000",
      },
    ];

    const layers = ["vector-parcels/parcels"];

    const andQuery = {
      fields,
      layers,
    };

    const outputFormat = "application/json";

    let wfsQueryXml = buildWfsQuery(
      andQuery,
      PARCELS_SRC,
      new proj.get("EPSG:3857"),
      outputFormat
    );

    const andXml =
      '<GetFeature xmlns="http://www.opengis.net/wfs" service="WFS" version="1.1.0" outputFormat="application/json" xmlns:ns1="http://www.w3.org/2001/XMLSchema-instance" ns1:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"><Query typeName="ms:parcels" srsName="EPSG:3857"><Filter xmlns="http://www.opengis.net/ogc"><And><PropertyIsEqualTo><PropertyName>OWNER_NAME</PropertyName><Literal>peterson</Literal></PropertyIsEqualTo><PropertyIsGreaterThan><PropertyName>ACRES</PropertyName><Literal>5000</Literal></PropertyIsGreaterThan></And></Filter></Query></GetFeature>';

    expect(wfsQueryXml).toBe(andXml);

    const andQueryWithJoin = {
      fields: [["and"].concat(fields)],
      layers,
    };
    wfsQueryXml = buildWfsQuery(
      andQueryWithJoin,
      PARCELS_SRC,
      new proj.get("EPSG:3857"),
      outputFormat
    );

    expect(wfsQueryXml).toBe(andXml);
  });

  it("Test something a little fancy with OR and AND", () => {
    const fields = [
      {
        comparitor: "eq",
        name: "OWNER_NAME",
        value: "peterson",
      },
      {
        comparitor: "gt",
        name: "ACRES",
        value: "5000",
      },
    ];
    const layers = ["vector-parcels/parcels"];

    const orJoin = {
      fields: [
        {
          comparitor: "eq",
          name: "CITY",
          value: "LAKEVILLE",
        },
        ["or"].concat(fields),
      ],
      layers,
    };

    const wfsQueryXml = buildWfsQuery(
      orJoin,
      PARCELS_SRC,
      new proj.get("EPSG:3857"),
      "application/json"
    );
    const goneFancy =
      '<GetFeature xmlns="http://www.opengis.net/wfs" service="WFS" version="1.1.0" outputFormat="application/json" xmlns:ns1="http://www.w3.org/2001/XMLSchema-instance" ns1:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"><Query typeName="ms:parcels" srsName="EPSG:3857"><Filter xmlns="http://www.opengis.net/ogc"><And><PropertyIsEqualTo><PropertyName>CITY</PropertyName><Literal>LAKEVILLE</Literal></PropertyIsEqualTo><Or><PropertyIsEqualTo><PropertyName>OWNER_NAME</PropertyName><Literal>peterson</Literal></PropertyIsEqualTo><PropertyIsGreaterThan><PropertyName>ACRES</PropertyName><Literal>5000</Literal></PropertyIsGreaterThan></Or></And></Filter></Query></GetFeature>';

    expect(wfsQueryXml).toBe(goneFancy);
  });

  it("handles an alternative geometry colum (geometry-name param)", () => {
    const geomQuery = {
      selection: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [0, 90],
                [-120, 90],
                [-120, 0],
                [0, 0],
              ],
            ],
          },
        },
      ],
      fields: [],
      layers: ["vector-parcels/parcels"],
    };

    const outputFormat = "text/xml; subtype=gml/2.1.2";
    const queryResults = buildWfsQuery(
      geomQuery,
      PARCELS_SRC,
      new proj.get("EPSG:3857"),
      outputFormat
    );

    expect(queryResults).toContain("<PropertyName>geom</PropertyName>");

    const geomColumn = "CustomGeometryColumn";
    const mapSourceWithGeom = Object.assign({}, PARCELS_SRC, {
      config: Object.assign({}, PARCELS_SRC.config, {
        "geometry-name": geomColumn,
      }),
    });
    const customNameResults = buildWfsQuery(
      geomQuery,
      mapSourceWithGeom,
      new proj.get("EPSG:3857"),
      outputFormat
    );

    expect(customNameResults).toContain(
      "<PropertyName>" + geomColumn + "</PropertyName>"
    );
  });
});
