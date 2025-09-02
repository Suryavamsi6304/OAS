import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Lock, BookOpen, Shield, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Modern Login Component with enhanced UI/UX
 */
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      switch (user?.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'mentor':
          navigate('/mentor');
          break;
        case 'learner':
          navigate('/learner');
          break;
        default:
          navigate('/login');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await login(data);
    
    if (result.success) {
      // Navigation handled by useEffect
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Background Elements */}
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-content">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="brand-content">
            <div className="brand-icon">
              <BookOpen size={48} />
            </div>
            <h1 className="brand-title">Online Assessment System</h1>
            <p className="brand-subtitle">
              Empowering education through intelligent assessment solutions
            </p>
            
            <div className="features-list">
              <div className="feature-item">
                <Shield size={20} />
                <span>Secure & Reliable</span>
              </div>
              <div className="feature-item">
                <Award size={20} />
                <span>Real-time Results</span>
              </div>
              <div className="feature-item">
                <BookOpen size={20} />
                <span>Smart Analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your learning journey</p>
            </div>

            <form className="modern-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="input-group">
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <input
                    {...register('username', { required: 'Username is required' })}
                    type="text"
                    className={`modern-input ${errors.username ? 'error' : ''}`}
                    placeholder="Username"
                  />
                </div>
                {errors.username && (
                  <span className="error-message">{errors.username.message}</span>
                )}
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    className={`modern-input ${errors.password ? 'error' : ''}`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`modern-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="register-link">
                  Create Account
                </Link>
              </p>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;