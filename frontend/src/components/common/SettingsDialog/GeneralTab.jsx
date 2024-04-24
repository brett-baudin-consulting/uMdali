import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { userShape } from "../../../model/userPropType";
import i18n from "../../../i18n";
import "./GeneralTab.scss";

const GeneralTab = ({ user, setUser }) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(user.settings.language || 'en');
  const [languageOptions, setLanguageOptions] = useState([]);

  useEffect(() => {
    setLanguageOptions([
      { value: 'en', label: t('english_language_title') },
      { value: 'es', label: t('spanish_language_title') },
      { value: 'fr', label: t('french_language_title') },
      { value: 'de', label: t('german_language_title') },
      { value: 'hi', label: t('hindi_language_title') },
    ]);
  }, [t]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    setUser(prevUser => ({
      ...prevUser,
      settings: { ...prevUser.settings, language: newLanguage },
    }));
  };

  const handleThemeChange = (e) => {
    setUser(prevUser => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        theme: e.target.value,
      },
    }));
  };

  return (
    <div className="general-tab">
      <div>
        <label>
          {t('language_title')}:
          <select value={selectedLanguage} onChange={handleLanguageChange}>
            {languageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          {t('theme_title')}:
          <select value={user.settings.theme} onChange={handleThemeChange}>
            <option value="light">{t('light_theme_title')}</option>
            <option value="dark">{t('dark_theme_title')}</option>
          </select>
        </label>
      </div>
    </div>
  );
};

GeneralTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
};

export default GeneralTab;