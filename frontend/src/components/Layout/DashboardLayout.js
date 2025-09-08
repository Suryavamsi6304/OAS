import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Bell, User, LogOut, 
  Briefcase, Users, BarChart3,
  FileText, Search, Home, Shield, Eye, AlertTriangle, Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Role-based Navigation Configuration
 */
const getNavItems = (role) => {
  const navItems = {
    admin: [
      { icon: Home, label: 'Dashboard', path: '/admin' },
      { icon: Layers, label: 'Batches', path: '/admin/batches' },
      { icon: Briefcase, label: 'Jobs', path: '/admin/jobs' },
      { icon: Users, label: 'Applications', path: '/admin/applications' },
      { icon: Users, label: 'Users', path: '/admin/users' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' }
    ],
    mentor: [
      { icon: Home, label: 'Dashboard', path: '/mentor' },
      { icon: FileText, label: 'Practice Tests', path: '/mentor/create-practice' },
      { icon: BarChart3, label: 'Skill Assessments', path: '/mentor/create-skill' },
      { icon: Users, label: 'Re-attempt Requests', path: '/mentor/re-attempts' },
      { icon: Shield, label: 'Proctoring Logs', path: '/mentor/proctoring-logs' },
      { icon: Eye, label: 'Live Monitor', path: '/mentor/live-monitor' },
      { icon: AlertTriangle, label: 'Approval Requests', path: '/mentor/approval-requests' }
    ],
    learner: [
      { icon: Home, label: 'Dashboard', path: '/learner' },
      { icon: FileText, label: 'Practice Tests', path: '/learner/practice-tests' },
      { icon: BarChart3, label: 'Skill Assessments', path: '/learner/skill-assessments' },
      { icon: AlertTriangle, label: 'Re-attempt Requests', path: '/learner/re-attempts' },
      { icon: Search, label: 'Find Jobs', path: '/learner/jobs' },
      { icon: FileText, label: 'Applications', path: '/learner/applications' },
      { icon: User, label: 'Profile', path: '/learner/profile' }
    ]
  };
  
  return navItems[role] || [];
};

/**
 * Dashboard Layout Component
 */
const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = getNavItems(user?.role);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '256px',
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transform: isDesktop ? 'translateX(0)' : (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'),
        transition: 'transform 0.3s ease',
        zIndex: 50
      }}>
        
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          padding: '0 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>RecruitPro</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            style={{ 
              display: isDesktop ? 'none' : 'block',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: 'none',
              color: '#9ca3af',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div style={{ marginLeft: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ marginTop: '24px', padding: '0 12px', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#4b5563',
                  borderRight: isActive ? '2px solid #1d4ed8' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.color = '#111827';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#4b5563';
                  }
                }}
              >
                <Icon style={{ width: '20px', height: '20px', marginRight: '12px' }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          padding: '12px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#dc2626',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <LogOut style={{ width: '20px', height: '20px', marginRight: '12px' }} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        marginLeft: isDesktop ? '256px' : '0',
        overflow: 'hidden' 
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            padding: '0 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  display: isDesktop ? 'none' : 'block',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}
              >
                <Menu size={20} />
              </button>
              <h2 style={{ 
                marginLeft: '8px', 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937',
                margin: 0 
              }}>{title}</h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Notifications */}
              <button style={{
                padding: '8px',
                color: '#9ca3af',
                borderRadius: '50%',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <Bell size={20} />
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#ef4444',
                  borderRadius: '50%'
                }}></span>
              </button>
              
              {/* Profile */}
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User style={{ width: '20px', height: '20px', color: 'white' }} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && !isDesktop && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;