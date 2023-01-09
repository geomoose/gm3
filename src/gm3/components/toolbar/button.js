/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2022 Dan "Ducky" Little
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

/** React.Component for rendering a toolbar!
 *
 */

import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useTranslation } from "react-i18next";

import { startService } from "../../actions/query";
import { runAction } from "../../actions/ui";

export const BaseToolbarButton = ({ onClick, className, label, tip }) => (
  <button
    className={`toolbar-button ${className}`}
    onClick={onClick}
    title={tip || label}
  >
    <span className="icon"></span>
    <span className="label">{label}</span>
  </button>
);

export const ToolbarButton = ({
  tool,
  runAction,
  startService,
  currentService,
  currentDrawTool,
  serviceDef,
}) => {
  const { t } = useTranslation();
  const label = t(tool.label);
  const tip = !!tool.tip ? t(tool.tip) : label;
  const active = tool.name === currentService;

  const onClick = useCallback(() => {
    if (tool.actionType === "service") {
      let defaultTool = null;
      if (serviceDef && serviceDef.tools && serviceDef.tools.default) {
        defaultTool = serviceDef.tools.default;
      }
      startService({ serviceName: tool.name, defaultTool });
    } else if (tool.actionType === "action") {
      runAction(tool.name);
    }
  }, [startService, tool, serviceDef, runAction]);

  return (
    <BaseToolbarButton
      key={tool.name}
      onClick={onClick}
      label={label}
      tip={tip}
      className={`${active ? "active " : ""}${
        tool.cssClass || "tool " + tool.name
      }`}
    />
  );
};

ToolbarButton.propTypes = {
  tool: PropTypes.object.isRequired,
  runAction: PropTypes.func,
  startService: PropTypes.func,
  currentService: PropTypes.string,
  currentDrawTool: PropTypes.string,
  serviceDef: PropTypes.object,
};

const mapState = (state) => ({
  currentService: state.query.serviceName,
  currentDrawTool: state.map.interactionType,
});

const mapDispatch = {
  runAction,
  startService,
};

export default connect(mapState, mapDispatch)(ToolbarButton);
