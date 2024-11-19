// DataTab.jsx  
import React, { useMemo, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import SelectField from "./SelectField";
import { userShape } from "../../../model/userPropType";
import { importData } from "../../../api/dataImportModelService";
import "./DataTab.scss";

const DataTab = ({ user, setUser, dataImportModels = [] }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sortedDataImportModels = useMemo(() =>
    [...dataImportModels].sort((a, b) => a.name.localeCompare(b.name)),
    [dataImportModels]
  );

  const handleDataChange = useCallback((e) => {
    const dataImportId = e.target.value;
    setUser((prevUser) => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        dataImport: {
          ...prevUser.settings?.dataImport,
          dataImportId,
        },
      },
    }));
  }, [setUser]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      await importData(user, jsonData);
    } catch (error) {
      setError(
        error instanceof SyntaxError
          ? t('invalid_json_error')
          : t('general_import_error')
      );
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  const selectOptions = useMemo(() => (
    sortedDataImportModels.length > 0 ? (
      sortedDataImportModels.map(({ id, name }) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))
    ) : (
      <option value="">{t('no_data_available')}</option>
    )
  ), [sortedDataImportModels, t]);

  const isImportEnabled = Boolean(user?.settings?.dataImport?.dataImportId);

  return (
    <div className="data-tab">
      <div className="data-tab__container">
        <div className="data-tab__field-group">
          <SelectField
            label={`${t('data_import_title')}:`}
            value={user?.settings?.dataImport?.dataImportId || ''}
            onChange={handleDataChange}
            options={selectOptions}
          />

          <button
            className="data-tab__button"
            onClick={handleImport}
            disabled={!isImportEnabled || isLoading}
          >
            {isLoading ? t('importing') : t('import')}
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="data-tab__file-input"
          onChange={handleFileChange}
          accept=".json"
          aria-label={t('choose_file')}
        />
      </div>

      {error && <p className="data-tab__error">{error}</p>}
    </div>
  );
};

export default DataTab;  