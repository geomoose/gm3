/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 Dan "Ducky" Little
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

import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { TableVirtuoso } from "react-virtuoso";

import { unparse as writeCsv } from "papaparse";
import Mark from "markup-js";
import FileSaver from "file-saver";

import { FORMAT_OPTIONS, matchFeatures } from "../../util";

import { getLayerFromPath } from "../../actions/mapSource";

import { getFlatResults, getQueryResults } from "../../selectors/query";
import { SERVICE_STEPS } from "../../reducers/query";

import FilterModal from "./filter-modal";

/* Renders query results as a table that can be sorted, filtered,
 * and downloaded as a CSV file.
 *
 */
class Grid extends React.Component {
  constructor() {
    super();

    // configure the default state of the sort,
    //  null means in results-order.
    this.state = {
      sortBy: null,
      sortAs: "string",
      sortAsc: true,
      minimized: false,
      showGrid: false,
      filterModal: null,
    };

    this.nextSort = this.nextSort.bind(this);
  }

  nextSort(column) {
    // rotate to the next sort type
    if (this.state.sortBy === column.property) {
      // when sorted ascending, go to descending
      if (this.state.sortAsc) {
        this.setState({ sortAsc: false });
        // if the sort is descending already, go
        //  back to a neutral state
      } else {
        this.setState({ sortBy: null, sortAsc: true });
      }
    } else {
      const sortAs = column.sortAs ? column.sortAs : "string";
      this.setState({
        sortBy: column.property,
        sortAsc: true,
        sortAs: sortAs,
      });
    }
  }

  getHeaderRow(results, headerConf) {
    return headerConf.map((columnDef, colIdx) => {
      let sortTool = false;
      let filterControl = false;
      let sortClasses = "icon sort";

      if (columnDef.sortAs) {
        const sortTitle = this.props.t("filter-sort");
        if (this.state.sortBy === columnDef.property) {
          sortClasses += this.state.sortAsc ? " asc" : " desc";
        }
        sortTool = (
          <i
            title={sortTitle}
            onClick={() => {
              this.nextSort(columnDef);
            }}
            className={sortClasses}
          ></i>
        );
      }

      if (columnDef.filter) {
        // TODO: Get a translation friendly title attribute
        filterControl = (
          <i
            title="Filter"
            onClick={() => {
              this.setState({
                filterModal: columnDef,
              });
            }}
            className="filter icon"
          />
        );
      }

      return (
        <th key={`col${colIdx}`}>
          {columnDef.title} {sortTool} {filterControl}
        </th>
      );
    });
  }

  sortResults(results) {
    const collator = Intl.Collator();
    const sortedResults = [].concat(results);

    const sortColumn = this.state.sortBy;
    const sortAsc = this.state.sortAsc;
    const sortAs = this.state.sortAs;

    sortedResults.sort((a, b) => {
      let valueA = a.properties[sortColumn];
      let valueB = b.properties[sortColumn];
      if (sortAs === "number") {
        valueA = parseFloat(valueA);
        valueB = parseFloat(valueB);

        // assume value a is less than value b
        let sortValues = -1;
        if (isNaN(valueB) || valueB === null) {
          sortValues = 1;
        } else if (valueB < valueA) {
          sortValues = 1;
        }
        if (!sortAsc) {
          sortValues = sortValues * -1;
        }
        return sortValues;
      }
      if (sortAsc) {
        return collator.compare(valueA, valueB);
      }
      return collator.compare(valueB, valueA);
    });
    return sortedResults;
  }

  getRow(result, rowTemplate) {
    const html = Mark.up(rowTemplate, result, FORMAT_OPTIONS);
    // WARNING! If odd grid errors show up with row rendering,
    //          start here!
    // This code is potentially fragile but keeps the table
    //  templates backwards compatible.
    const strippedHTML = html.substring(
      html.indexOf("<td"),
      html.lastIndexOf("</td>") + 5
    );
    // get the contents of the "<td>" cells
    const tmpElement = document.createElement("tr");
    tmpElement.innerHTML = strippedHTML;
    const cells = tmpElement.getElementsByTagName("td");
    const elements = [];

    for (let i = 0, ii = cells.length; i < ii; i++) {
      elements.push(
        <td
          key={`cell-${i}`}
          dangerouslySetInnerHTML={{ __html: cells[i].innerHTML }}
        />
      );
    }
    return elements;
  }

  resultsAsCSV(gridCols, features) {
    const attributes = [];
    const featureData = [];

    // get the export columns
    for (const column of gridCols) {
      if (column.property) {
        attributes.push(column.property);
      }
    }

    // add the 'header' row with the attribute names
    featureData.push(attributes);

    // for each feature, create a row.
    for (const feature of features) {
      const row = [];
      for (const attr of attributes) {
        row.push(feature.properties[attr]);
      }
      featureData.push(row);
    }

    // create the data
    const csvBlob = new Blob([writeCsv(featureData)], {
      type: "text/csv;charset=utf-8",
    });

    // create a unique string
    const uniq = "" + new Date().getTime();
    const csvName = "download_" + uniq + ".csv";

    // now have FileSaver 'normalize' how to do a save-as.
    FileSaver.saveAs(csvBlob, csvName);
  }

  componentDidUpdate(prevProps) {
    // The `showGrid` logic is used to prevent the grid
    //  from "flashing" in appearance and being immeidately
    //  minimized.
    if (this.props.query.step !== prevProps.query.step) {
      if (this.props.query.step === SERVICE_STEPS.RESULTS) {
        let minimized = false;
        if (this.props.query.query.runOptions) {
          if (this.props.query.query.runOptions.gridMinimized) {
            minimized = true;
          }
        }
        this.setState({
          minimized,
          showGrid: true,
        });
      } else {
        this.setState({
          showGrid: false,
        });
      }
    }
  }

  render() {
    const query = this.props.query;

    let features = [];
    let displayTable = false;

    let gridColumns, gridRow;

    if (query.step === SERVICE_STEPS.RESULTS && this.state.showGrid) {
      const service = this.props.services[query.serviceName];
      const serviceName = service.alias || service.name;
      const paths = Object.keys(query.results);
      paths.forEach((layerPath) => {
        let layer = null;
        try {
          layer = getLayerFromPath(this.props.mapSources, layerPath);
        } catch (err) {
          // no layer, no problem.
        }

        if (layer !== null) {
          const columnTemplate =
            layer.templates[serviceName + "-grid-columns"] ||
            layer.templates.gridColumns;

          // try to parse the grid columns
          if (columnTemplate && typeof columnTemplate.contents === "object") {
            gridColumns = columnTemplate.contents;
          } else {
            try {
              gridColumns = JSON.parse(columnTemplate.contents);
            } catch (err) {
              // swallow the error
            }
          }

          const rowTemplate =
            layer.templates[serviceName + "-grid-row"] ||
            layer.templates.gridRow;

          if (rowTemplate) {
            gridRow = rowTemplate.contents;
          }

          if (gridColumns && gridRow) {
            // render as a grid.
            features = matchFeatures(query.results[layerPath], query.filter);
            if (query.results[layerPath].length > 0) {
              displayTable = true;
            }
          } else {
            // console.error(layerPath + ' does not have gridColumns or gridRow templates.');
          }
        }
      });
    }

    // render the empty string if there is nothing to show.
    if (!displayTable) {
      return false;
    }

    if (this.state.sortBy !== null) {
      features = this.sortResults(features);
    }

    // when minimized, show the maximize button.
    const minBtnClass = this.state.minimized ? "maximize" : "minimize";
    const toggleGrid = () => {
      this.setState({ minimized: !this.state.minimized });
    };

    return (
      <div className="gm-grid">
        {this.state.filterModal && (
          <FilterModal
            store={this.props.store}
            column={this.state.filterModal}
            filters={this.props.filters}
            results={this.props.allResults}
            onClose={() => this.setState({ filterModal: null })}
          />
        )}
        <div className="toolbar">
          <span
            onClick={() => {
              this.resultsAsCSV(gridColumns, features);
            }}
            className={"tool download"}
            title={this.props.t("grid-download-csv")}
          >
            <i className="icon download"></i>
          </span>
          <span
            onClick={toggleGrid}
            className={"tool " + minBtnClass}
            title={this.props.t("grid-min-max")}
          >
            <i className={"icon " + minBtnClass}></i>
          </span>
        </div>

        <TableVirtuoso
          style={{
            transition: "height 500ms",
            height: this.state.minimized ? 0 : 400,
          }}
          data={features}
          fixedHeaderContent={(index, feature) => {
            return <tr>{this.getHeaderRow(features, gridColumns)}</tr>;
          }}
          itemContent={(index, feature) =>
            this.getRow(feature, gridRow, gridColumns)
          }
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  query: state.query,
  results: getQueryResults(state),
  allResults: getFlatResults(state),
  mapSources: state.mapSources,
  filters: state.query.filter,
});

export default connect(mapStateToProps)(withTranslation()(Grid));
