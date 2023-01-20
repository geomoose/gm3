import React from "react";
import { useTranslation } from "react-i18next";

const DefaultPlaceholder = () => {
  const { t } = useTranslation();
  return <div className="info-box">{t("start-service-help")}</div>;
};

export const EmptyPlaceholder = () => {
  return <DefaultPlaceholder />;
};
