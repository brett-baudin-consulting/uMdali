// components/FileUploadButton.jsx  
import { memo } from 'react';  
import PropTypes from 'prop-types';  
import { useTranslation } from 'react-i18next';

const FileUploadButton = ({ disabled = false, onClick }) => {  
  const { t } = useTranslation();

  return (  
    <button  
      className="file-upload-button"  
      aria-label={t("attach_title")}  
      onClick={onClick}  
      disabled={disabled}  
      type="button"  
    >  
      <span className="file-upload-button__text">  
        {t("attach")}  
      </span>  
    </button>  
  );  
};

FileUploadButton.propTypes = {  
  disabled: PropTypes.bool,  
  onClick: PropTypes.func.isRequired  
};

export default memo(FileUploadButton);  