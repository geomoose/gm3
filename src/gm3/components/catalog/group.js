/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017,2025 Dan "Ducky" Little
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
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import MetadataTool from "./tools/metadata";

const CatalogGroup = ({ group, onExpand, children }) => {
  const { t } = useTranslation();
  const classes = "group " + (!!group.expand ? "gm-expand" : "gm-collapse");
  return (
    <div key={group.id} className={classes}>
      <div className="group-label" title={t(group.tip)}>
        <input
          className="group-toggle icon"
          type="checkbox"
          checked={!!group.expand}
          onChange={onExpand}
        />
        <span onClick={onExpand}>
          {t(group.label)}{" "}
          {!group.metadata_url ? (
            false
          ) : (
            <MetadataTool href={group.metadata_url} />
          )}
        </span>
      </div>
      <div className="children">{children}</div>
    </div>
  );
};

CatalogGroup.defaultProps = {
  onExpand: () => {},
};

CatalogGroup.propTypes = {
  onExpand: PropTypes.func,
  group: PropTypes.object.isRequired,
};

export default CatalogGroup;
