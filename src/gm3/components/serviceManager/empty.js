import React from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";

const DefaultPlaceholder = () => {
  const { t } = useTranslation();
  return <div className="info-box">{t("start-service-help")}</div>;
};

const EmptyPlaceholder = ({ emptyHTML }) => {
  if (emptyHTML) {
    let displayHTML = emptyHTML;
    // check to see if the configuration specifys an element ID
    if (emptyHTML.startsWith("#")) {
      // ensure the element exists...
      const element = document.getElementById(emptyHTML.substring(1));
      if (element) {
        displayHTML = element.innerHTML;
      }
    }
    return (
      <div
        className="empty-message"
        dangerouslySetInnerHTML={{ __html: displayHTML }}
      />
    );
  }
  return <DefaultPlaceholder />;
};

const mapStateToProps = (state) => ({
  emptyHTML: state.config.serviceManager?.emptyHTML,
});

export default connect(mapStateToProps)(EmptyPlaceholder);
