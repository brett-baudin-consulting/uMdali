// GeneralTab.jsx  
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import SelectField from "./SelectField";
import { userShape } from "../../../model/userPropType";
import i18n from "../../../i18n";

import "./GeneralTab.scss";

const GeneralTab = ({ user, setUser }) => {
  const { t } = useTranslation();

  const languageOptions = useMemo(() => [
    { value: 'en', label: t('english_language_title') },
    { value: 'es', label: t('spanish_language_title') },
    { value: 'fr', label: t('french_language_title') },
    { value: 'de', label: t('german_language_title') },
    { value: 'hi', label: t('hindi_language_title') },
  ], [t]);

  const themeOptions = useMemo(() => [
    { value: 'light', label: t('light_theme_title') },
    { value: 'dark', label: t('dark_theme_title') },
  ], [t]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    i18n.changeLanguage(newLanguage);
    setUser(prevUser => ({
      ...prevUser,
      settings: { ...prevUser.settings, language: newLanguage },
    }));
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setUser(prevUser => ({
      ...prevUser,
      settings: { ...prevUser.settings, theme: newTheme },
    }));
  };

  return (
    <div className="general-tab">
      <SelectField
        label={t('language_title')}
        value={user.settings.language || 'en'}
        onChange={handleLanguageChange}
        options={languageOptions.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      />
      <SelectField
        label={t('theme_title')}
        value={user.settings.theme}
        onChange={handleThemeChange}
        options={themeOptions.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      />
    </div>
  );
};

GeneralTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
};

export default GeneralTab;  