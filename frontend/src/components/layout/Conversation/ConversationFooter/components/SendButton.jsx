import { useTranslation } from 'react-i18next';
import { BeatLoader } from "react-spinners";
import PropTypes from 'prop-types';

const SendButton = ({ disabled, isStreaming, isWaitingForResponse, onClick }) => {  
  const { t } = useTranslation();  
    
  return (  
    <button  
      title={t("send_title")}   
      onClick={onClick}  
      disabled={disabled || isStreaming || isWaitingForResponse}  
      className="send-button"  
    >  
      {isStreaming || isWaitingForResponse ?   
        <BeatLoader color="white" size="6px" /> : "➢"}  
    </button>  
  );  
};

export default SendButton;
SendButton.propTypes = {  
  disabled: PropTypes.bool,  
  isStreaming: PropTypes.bool,  
  isWaitingForResponse: PropTypes.bool,  
  onClick: PropTypes.func.isRequired  
};  