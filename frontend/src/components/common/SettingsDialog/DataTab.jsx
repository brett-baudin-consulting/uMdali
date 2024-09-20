import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { userShape } from "../../../model/userPropType";
import { importData } from "../../../api/dataImportModelService";
import "./DataTab.scss";

const DataTab = ({ user, setUser, dataImportModels }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const sortedDataImportModels = useMemo(() => {
    return dataImportModels
      ? [...dataImportModels].sort((a, b) => a.name.localeCompare(b.name))
      : [];
  }, [dataImportModels]);

  const handleDataChange = (e) => {
    const dataImportId = e.target.value;
    setUser((prevUser) => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        dataImport: {
          ...prevUser.settings.dataImport,
          dataImportId: dataImportId,
        },
      },
    }));
  };

  const handleImport = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target.result;
          const jsonData = JSON.parse(content);

          await importData(user, jsonData);

          // Add success feedback here  
        } catch (error) {
          if (error instanceof SyntaxError) {
            console.error("Invalid JSON format:", error);
            // Add specific feedback for invalid JSON  
          } else {
            console.error("Error importing data:", error);
            // Add general error feedback  
          }
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        setIsLoading(false);
        // Add error feedback for file reading issues  
      };

      reader.readAsText(file);
    }
  };

  const isImportEnabled = user.settings.dataImport.dataImportId !== "";

  return (
    <div className="data-tab">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label>
          {t('data_import_title')}:
          <select
            value={user.settings.dataImport.dataImportId}
            onChange={handleDataChange}
            disabled={sortedDataImportModels.length === 0}
          >
            {sortedDataImportModels.length > 0 ? (
              sortedDataImportModels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))
            ) : (
              <option value="">{t('no_data_available')}</option>
            )}
          </select>
        </label>
        <button
          onClick={handleImport}
          disabled={!isImportEnabled || isLoading}
        >
          {isLoading ? t('importing') : t('import')}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".json" // Specify accepted file types  
        />
      </div>
    </div>
  );
};

DataTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
  dataImportModels: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })),
};

export default DataTab;  