/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Dan "Ducky" Little
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
import { connect } from "react-redux";
import { useTranslation } from "react-i18next";

import Modal from "./modal";
import { clearSelectionError, setSelectionBuffer } from "../actions/map";
import { finishService } from "../actions/query";

/** Tells the user why the selection could not be buffered.
 *
 *  "Close" keeps the selection so a smaller distance can be tried;
 *  "Start over" clears the selection, the buffer and the service.
 */
export const SelectionErrorModal = ({ error, onClose, onStartOver }) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={error !== null}
      title="geometry-error-title"
      options={[
        { value: "start-over", label: "start-over" },
        { value: "close", label: "Close" },
      ]}
      onClose={(choice) => {
        if (choice === "start-over") {
          onStartOver();
        } else {
          onClose();
        }
      }}
    >
      {error === null ? "" : t(error)}
    </Modal>
  );
};

SelectionErrorModal.propTypes = {
  error: PropTypes.string,
  onClose: PropTypes.func,
  onStartOver: PropTypes.func,
};

SelectionErrorModal.defaultProps = {
  error: null,
  onClose: () => {},
  onStartOver: () => {},
};

export const mapStateToProps = (state) => ({
  error: state.map.selectionError,
});

export const mapDispatchToProps = (dispatch) => ({
  onClose: () => {
    dispatch(clearSelectionError());
  },
  onStartOver: () => {
    dispatch(clearSelectionError());
    dispatch(setSelectionBuffer(0));
    dispatch(finishService());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SelectionErrorModal);
