import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import useAuth from '../../../hooks/useAuth';
import { getUser } from '../../../api/userService';

import './LoginDialog.scss';

const LoginDialog = ({ setUser }) => {
  const { userLogin } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const error = await userLogin(username, password);
      if (error) {
        setLoginError(error);
        return;
      }
      const userDetails = await getUser(username);
      console.log('userDetails: ', userDetails);
      setUser(userDetails);
    } catch (fetchError) {
      console.error(fetchError);
      setLoginError(fetchError.message || t('loginError'));
    }
  };

  const handleChange = (setter) => (e) => {
    setter(e.target.value);
  };

  return (
    <div className="login-container">
      <h1 className='login-title'>{t('app_title')}</h1> {/* Translated App Title */}
      <img className='login-image' src={`${process.env.PUBLIC_URL}/app_image.png`} alt={t('app_title')} /> {/* Image from public directory */}
      <form onSubmit={handleSubmit} className="login-form">
        <input
          id="username"
          type="text"
          name="username"
          placeholder={t('username')}
          value={username}
          onChange={handleChange(setUsername)}
        />
        <input
          id="password"
          type="password"
          name="password"
          placeholder={t('password')}
          value={password}
          onChange={handleChange(setPassword)}
        />
        {loginError && <div className="login-error">{t('loginError')}</div>}
        <button type="submit">{t('login')}</button>
      </form>
    </div>
  );
};

LoginDialog.propTypes = {
  setUser: PropTypes.func.isRequired,
};

export default LoginDialog;