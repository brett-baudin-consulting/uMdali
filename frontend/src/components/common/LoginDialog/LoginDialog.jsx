import React, { useState } from 'react';  
import { useTranslation } from 'react-i18next';  
import PropTypes from 'prop-types';  
import useAuth from '../../../hooks/useAuth';  
import { getUser } from '../../../api/userService';

import './LoginDialog.scss';

const LoginDialog = ({ setUser }) => {  
  const { userLogin } = useAuth();  
  const { t } = useTranslation();  
  const [formData, setFormData] = useState({  
    username: '',  
    password: '',  
  });  
  const [loginError, setLoginError] = useState('');  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {  
    e.preventDefault();  
    setIsLoading(true);  
    setLoginError('');

    try {  
      const { username, password } = formData;  
      const error = await userLogin(username, password);  
        
      if (error) {  
        setLoginError(error);  
        return;  
      }

      const userDetails = await getUser(username);  
      setUser(userDetails);  
    } catch (error) {  
      console.error('Login error:', error);  
      setLoginError(t('loginError'));  
    } finally {  
      setIsLoading(false);  
    }  
  };

  const handleChange = (e) => {  
    const { name, value } = e.target;  
    setFormData(prev => ({  
      ...prev,  
      [name]: value  
    }));  
  };

  return (  
    <div className="login-container">  
      <h1 className="login-title">{t('app_title')}</h1>  
      <img   
        className="login-image"   
        src={`${process.env.PUBLIC_URL}/app_image.png`}   
        alt={t('app_title')}   
      />  
      <form onSubmit={handleSubmit} className="login-form">  
        <input  
          id="username"  
          type="text"  
          name="username"  
          placeholder={t('username')}  
          value={formData.username}  
          onChange={handleChange}  
          disabled={isLoading}  
        />  
        <input  
          id="password"  
          type="password"  
          name="password"  
          placeholder={t('password')}  
          value={formData.password}  
          onChange={handleChange}  
          disabled={isLoading}  
        />  
        {loginError && (  
          <div className="login-error" role="alert">  
            {loginError}  
          </div>  
        )}  
        <button type="submit" disabled={isLoading}>  
          {isLoading ? t('loggingIn') : t('login')}  
        </button>  
      </form>  
    </div>  
  );  
};

LoginDialog.propTypes = {  
  setUser: PropTypes.func.isRequired,  
};

export default LoginDialog;  