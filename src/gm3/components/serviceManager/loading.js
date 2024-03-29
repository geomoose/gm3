/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2023 Dan "Ducky" Little
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
import { useTranslation } from "react-i18next";
import GeoMooseLogo from "./logo";

const styleString = `
    @keyframes jumparound {
        0% { transform: translateY(0px); }
        75% { transform: translateY(-15px); }
        100% { transform: translateY(0px); }
    }
`;

const DefaultLoadingIndicator = () => {
  const { t } = useTranslation();
  return (
    <React.Fragment>
      <style type="text/css">{styleString}</style>
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <GeoMooseLogo />
        <div>{t("Loading...")}</div>
      </div>
    </React.Fragment>
  );
};

const LoadingIndicator = ({ loadingHTML }) => {
  if (loadingHTML) {
    let displayHTML = loadingHTML;
    // check to see if the configuration specifys an element ID
    if (loadingHTML.startsWith("#")) {
      // ensure the element exists...
      const element = document.getElementById(loadingHTML.substring(1));
      if (element) {
        displayHTML = element.innerHTML;
      }
    }
    return (
      <div
        className="loading-message"
        dangerouslySetInnerHTML={{ __html: displayHTML }}
      />
    );
  }
  return <DefaultLoadingIndicator />;
};

const mapStateToProps = (state) => ({
  loadingHTML: state.config.serviceManager?.loadingHTML,
});

export default connect(mapStateToProps)(LoadingIndicator);
