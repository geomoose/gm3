/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2022,2026 Dan "Ducky" Little
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

/* Rotate a column's sort: ascending, then descending, then results-order.
 * A sortBy of null means results-order.
 */
export function nextSortState(state, column) {
  if (state.sortBy === column.property) {
    // when sorted ascending, go to descending
    if (state.sortAsc) {
      return { sortAsc: false };
    }
    // if the sort is descending already, go
    //  back to a neutral state
    return { sortBy: null, sortAsc: true };
  }
  return {
    sortBy: column.property,
    sortAsc: true,
    sortAs: column.sortAs ? column.sortAs : "string",
  };
}

export function sortFeatures(features, { sortBy, sortAs, sortAsc }) {
  const collator = Intl.Collator();
  const sortedResults = [].concat(features);

  sortedResults.sort((a, b) => {
    let valueA = a.properties[sortBy];
    let valueB = b.properties[sortBy];
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
