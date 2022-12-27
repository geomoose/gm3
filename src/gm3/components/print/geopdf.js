/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
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

export default function jsGeoPdfPlugin(jsPDFAPI) {
  const setGeoArea = function (pdfExt, geoExt) {
    const bbox = pdfExt.join(" ");

    // the ordering may seem odd here but PDF
    //  flips the Y axis upside down and this accounts for that
    //  change.
    const minx = geoExt[0];
    const maxx = geoExt[2];
    const maxy = geoExt[1];
    const miny = geoExt[3];
    const bounds = [miny, minx, maxy, minx, maxy, maxx, miny, maxx].join(" ");

    const bboxObj = this.internal.newAdditionalObject();
    const boundsObj = this.internal.newAdditionalObject();
    const projObj = this.internal.newAdditionalObject();

    projObj.content =
      '<< /EPSG 3857 /Type /PROJCS /WKT (PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.017453292519943295]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]) >>';

    boundsObj.content =
      "<< /Bounds [ 0 1 0 0 1 0 1 1 ] /GCS " +
      projObj.objId +
      " 0 R /GPTS [ " +
      bounds +
      " ] /LPTS [ 0 1 0 0 1 0 1 1 ] /Subtype /GEO /Type /Measure >>";

    bboxObj.content =
      "<< /BBox [ " +
      bbox +
      " ] /Measure " +
      boundsObj.objId +
      " 0 R /Name (Layer) /Type /Viewport >>";

    const titleObj = this.internal.newAdditionalObject();
    titleObj.content = "<< /Name (User Generated Map) /Type /OCG >>";

    return bboxObj.objId;
  };

  jsPDFAPI.setGeoArea = function (pdfExt, geoExt) {
    this.internal.events.subscribe("putPage", function () {
      const bboxId = setGeoArea.call(this, pdfExt, geoExt);
      this.internal.write("/VP [ " + bboxId + " 0 R ]");
    });
  };
}
