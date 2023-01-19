import React from "react";
import { useTranslation } from "react-i18next";

import ModalDialog from "../modal";
import { addFilter, removeFilter } from "../../actions/query";
import { getFilterFieldNames } from "../../util";

const Label = ({ l }) => {
  const { t } = useTranslation();
  return <label>{t(l)}</label>;
};

const getListFilterValues = (filterDef, values = []) => {
  if (filterDef[0] === "==") {
    values.push(filterDef[2]);
  } else if (filterDef[0] === "in") {
    filterDef.slice(2).forEach((value) => {
      values.push(value);
    });
  } else if (filterDef[0] === "any") {
    filterDef.slice(1).forEach((elem) => {
      getListFilterValues(elem, values);
    });
  }
  return values;
};

class FilterModal extends ModalDialog {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.state = {
      value: "",
    };
  }

  onChange(evt) {
    this.setState({ value: evt.target.value });
  }

  setFilter() {
    const value = this.state.value;
    const property = this.props.column.property;

    const newFilters = [];

    if (this.props.column.filter.type === "list") {
      // undefined causes challenges for the filter generator
      //  this normalizes querying for an undefined value.
      const nextFilter = ["any"];
      value.forEach((v) => {
        nextFilter.push(["==", ["coalesce", ["get", property], ""], v]);
      });
      newFilters.push(nextFilter);
    } else if (this.props.column.filter.type === "range") {
      if (this.state.min !== "") {
        newFilters.push([">=", ["get", property], this.state.min]);
      }
      if (this.state.max !== "") {
        newFilters.push(["<=", ["get", property], this.state.max]);
      }
    } else {
      // straight equals...
      newFilters.push(["==", ["get", property], value]);
    }

    // remove the filters from the property
    this.props.store.dispatch(removeFilter(property));

    // add the new filters.
    newFilters.forEach((newFilter) => {
      // add/update this filter.
      this.props.store.dispatch(addFilter(newFilter));
    });
  }

  close(status) {
    if (status === "set" && this.state.value.length > 0) {
      this.setFilter();
    } else if (status === "clear" || this.state.value.length === 0) {
      // remove the filter from the query
      this.props.store.dispatch(removeFilter(this.props.column.property));
    }
    this.props.onClose();
  }

  getTitle() {
    return "Set filter for " + this.props.column.title;
  }

  getOptions() {
    return [
      { label: "Cancel", value: "dismiss" },
      { label: "Clear", value: "clear" },
      { label: "Set", value: "set" },
    ];
  }

  renderBody() {
    return (
      <div>
        <Label l="label-value" />{" "}
        <input onChange={this.onChange} value={this.state.value} ref="input" />
      </div>
    );
  }
}

const isEmpty = (value) =>
  value === "" || value === null || value === undefined;

/* Creates a settings Modal for lists of values.
 *
 * Each list option is rendered as a checkbox.
 *
 */
class ListFilterModal extends FilterModal {
  constructor(props) {
    super(props);

    const prop = this.props.column.property;
    const filterValues = props.filters
      .filter((filterDef) => {
        return getFilterFieldNames(filterDef).indexOf(prop) >= 0;
      })
      .map((filterDef) => getListFilterValues(filterDef))
      .flatMap((v) => v);

    let orderedValues = [];
    if (props.column.filter.values) {
      orderedValues = props.column.filter.values;
    } else {
      // get the values from the dataset.
      let includeEmpty = false;
      for (let i = 0, ii = this.props.results.length; i < ii; i++) {
        const result = this.props.results[i];
        const value = result.properties[prop];

        if (isEmpty(value)) {
          includeEmpty = true;
        } else if (orderedValues.indexOf(value) < 0) {
          orderedValues.push(value);
        }
      }
      // include the "empty string" value
      //  for handling "", null, and undefined.
      if (includeEmpty) {
        orderedValues.push("");
      }
    }

    const selectedValues = {};
    orderedValues.forEach((value) => {
      // an empty or a full list are the same thing
      selectedValues[value] =
        filterValues.length === 0 || filterValues.indexOf(value) >= 0;
    });

    // value is an array for list types.
    this.state = {
      value: [...orderedValues],
      orderedValues,
      selectedValues,
    };
  }

  renderBody() {
    const isChecked = (value) => this.state.selectedValues[value] === true;
    const nSelected = Object.keys(this.state.selectedValues).filter(
      (value) => this.state.selectedValues[value]
    ).length;
    // none selected is the same as all selected.
    const isAllSelected = nSelected === this.state.orderedValues.length;

    const toggleSelected = (value) => {
      const nextSelected = {
        ...this.state.selectedValues,
        [value]: !this.state.selectedValues[value],
      };

      this.setState({
        selectedValues: nextSelected,
        value: this.state.orderedValues.filter((value) => nextSelected[value]),
      });
    };

    const toggleAll = () => {
      const selectAll = !isAllSelected;
      const nextSelected = {};
      this.state.orderedValues.forEach((value) => {
        nextSelected[value] = selectAll;
      });
      this.setState({
        selectedValues: nextSelected,
        value: this.state.orderedValues.filter((value) => nextSelected[value]),
      });
    };

    return (
      <div
        style={{
          position: "relative",
          maxHeight: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="checkbox"
          onClick={() => toggleAll()}
          style={{ marginBottom: "4px" }}
        >
          <i className={`icon checkbox ${isAllSelected ? "on" : ""}`} />
          {isAllSelected ? "Select none" : "Select all"}
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {this.state.orderedValues.map((value) => (
            <div
              key={isEmpty(value) ? "(empty)" : value}
              className="checkbox"
              onClick={() => {
                toggleSelected(value);
              }}
            >
              <i className={`icon checkbox ${isChecked(value) ? "on" : ""}`} />
              {isEmpty(value) ? "(empty)" : value}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

/* Handle creating value ranges.
 *
 * Present the user with a min and max field to set
 * a range on a field.
 *
 */
class RangeFilterModal extends FilterModal {
  constructor(props) {
    super(props);

    const prop = this.props.column.property;
    const initialState = {
      min: "",
      max: "",
    };

    props.filters
      .filter((filterDef) => {
        return getFilterFieldNames(filterDef).indexOf(prop > 0);
      })
      .forEach((filterDef) => {
        if (filterDef[0] === ">=") {
          initialState.min = filterDef[2];
        } else if (filterDef[0] === "<=") {
          initialState.max = filterDef[2];
        }
      });

    this.setMax = this.setMax.bind(this);
    this.setMin = this.setMin.bind(this);

    this.state = initialState;
  }

  setBound(side, value) {
    const bounds = {};
    if (value !== "") {
      bounds[side] = parseFloat(value);
    } else {
      bounds[side] = "";
    }
    this.setState(bounds);
  }

  setMin(evt) {
    this.setBound("min", evt.target.value);
  }

  setMax(evt) {
    this.setBound("max", evt.target.value);
  }

  renderBody() {
    return (
      <div>
        <div>
          <Label l="label-min" />
          <input value={this.state.min} onChange={this.setMin} />
        </div>

        <div>
          <Label l="label-max" />
          <input value={this.state.max} onChange={this.setMax} />
        </div>
      </div>
    );
  }
}

/* Provides a control for filtering a column's values.
 */
class AutoFilterModal extends React.Component {
  render() {
    // if there is no filter or the filter is set to false,
    // then do not present filtering as an option
    if (!this.props.column.filter) {
      return false;
    }

    let ModalClass = false;
    switch (this.props.column.filter.type) {
      case "list":
        ModalClass = ListFilterModal;
        break;
      case "range":
        ModalClass = RangeFilterModal;
        break;
      default:
        ModalClass = FilterModal;
    }

    return (
      <ModalClass
        open={true}
        onClose={() => {
          this.props.onClose();
        }}
        column={this.props.column}
        results={this.props.results}
        store={this.props.store}
        filters={this.props.filters}
      />
    );
  }
}

export default AutoFilterModal;
