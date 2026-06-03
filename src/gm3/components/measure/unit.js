/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2023,2025 Dan "Ducky" Little
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
import { useTranslation } from "react-i18next";

// The preferred complementary unit so that length and area never mix
//  systems.  Keyed by the complementary measurement type being computed:
//   - "area":   which area unit to use for a given length unit
//   - "length": which length unit to use for a given area unit
const COMPLEMENTARY_UNIT = {
  // length unit -> area unit
  area: { m: "m", km: "km", ft: "ft", mi: "mi", ch: "ft" },
  // area unit -> length unit
  length: { m: "m", km: "km", ft: "ft", mi: "mi", a: "ft", h: "m" },
};

/* Given a newly-selected unit, return the unit the complementary measurement
 *  (length <-> area) should use so the two never mix -- e.g. so we never pair
 *  kilometers with square feet.
 *
 * @param {String} selectedUnit The unit just chosen.
 * @param {String} otherType    "length" or "area" -- the complementary type to
 *                               compute.
 *
 * @returns {String} The unit the complementary measurement should switch to.
 */
export const getComplementaryUnit = (selectedUnit, otherType) => {
  const mapping = COMPLEMENTARY_UNIT[otherType] || {};
  // fall back to the selected unit if it has no explicit mapping.
  return mapping[selectedUnit] || selectedUnit;
};

export const UnitOption = ({ onClick, unit, selected, isSq }) => {
  const { t } = useTranslation();
  return (
    <div className="unit-option">
      <input
        type="radio"
        name="measure-unit"
        checked={selected}
        onChange={() => {
          onClick();
        }}
      />
      <span
        onClick={() => {
          onClick();
        }}
      >
        {isSq ? `${t("measure-sq")} ` : ""}
        {t(`units-${unit}`)}
      </span>
    </div>
  );
};
