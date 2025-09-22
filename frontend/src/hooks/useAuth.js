import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useApiMutation } from './useApi';
import { authService } from '../services';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useLogin = () => {
  return useApiMutation(
    (credentials) => authService.login(credentials),
    {
      successMessage: 'Login successful!',
    }
  );
};

export const useRegister = () => {
  return useApiMutation(
    (userData) => authService.register(userData),
    {
      successMessage: 'Registration successful!',
    }
  );
};