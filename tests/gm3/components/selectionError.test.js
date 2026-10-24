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
import { fireEvent, render, screen } from "@testing-library/react";

import { SelectionErrorModal, mapDispatchToProps } from "gm3/components/selectionError";
import { clearSelectionError, setSelectionBuffer } from "gm3/actions/map";

describe("the selection error modal", () => {
  it("renders nothing without an error", () => {
    const { container } = render(<SelectionErrorModal error={null} />);
    expect(container.querySelector(".modal-frame")).toBe(null);
  });

  it("shows the translated error with a way out", () => {
    const onClose = jest.fn();
    const onStartOver = jest.fn();
    render(
      <SelectionErrorModal
        error="geometry-error-out-of-memory"
        onClose={onClose}
        onStartOver={onStartOver}
      />
    );
    // the test i18n returns keys, which is what proves they went through t()
    expect(screen.getByText("geometry-error-title")).toBeTruthy();
    expect(screen.getByText("geometry-error-out-of-memory")).toBeTruthy();

    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onStartOver).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByText("start-over"));
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });

  it("starting over clears the error, the buffer and the service", () => {
    const dispatch = jest.fn();
    const props = mapDispatchToProps(dispatch);

    props.onClose();
    expect(dispatch).toHaveBeenCalledWith(clearSelectionError());

    dispatch.mockClear();
    props.onStartOver();
    const types = dispatch.mock.calls.map(([action]) =>
      typeof action === "function" ? "thunk" : action.type
    );
    expect(types).toContain(clearSelectionError().type);
    expect(types).toContain(setSelectionBuffer(0).type);
    // finishService is a thunk that clears the selection and the service
    expect(types).toContain("thunk");
  });
});
