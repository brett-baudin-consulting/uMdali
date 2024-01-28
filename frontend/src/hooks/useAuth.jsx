import { useState, useCallback } from "react";
import { login } from "../api/authService";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const userLogin = useCallback(
    async (username, password) => {
      clearError();
      if (!username || !password) {
        setError("Username and password are required.");
        return "Username and password are required.";
      }
  
      try {
        const response = await login(username, password);
        if (response.error) {
          setError(response.error.message);
          return response.error.message;
        }
        setUser(response.user);
      } catch (e) {
        setError(e.message);
        return e.message;
      }
    },
    [clearError]
  );
  

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return { user, userLogin, logout, error, clearError };
};

export default useAuth;
