import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, Building, Eye, Search } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchTerm, jobs]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs');
      setJobs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewJobDetails = (jobId) => {
    window.location.href = `/learner/job/${jobId}`;
  };

  return (
    <DashboardLayout title="Find Jobs">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Find Your Dream Job
          </h1>
          <p style={{ color: '#6b7280' }}>
            Discover exciting career opportunities that match your skills
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ position: 'relative', maxWidth: '500px' }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#9ca3af' 
            }} />
            <input
              type="text"
              placeholder="Search jobs by title, description, department, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '32px' 
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <Briefcase size={24} style={{ color: '#3b82f6', margin: '0 auto 8px' }} />
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
              {filteredJobs.length}
            </h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Available Jobs</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p>Loading jobs...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="card" 
                style={{ 
                  margin: 0,
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {job.title}
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                    {job.description.substring(0, 120)}...
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {job.department && (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                      <Building size={16} style={{ marginRight: '8px' }} />
                      {job.department}
                    </div>
                  )}
                  {job.location && (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                      <MapPin size={16} style={{ marginRight: '8px' }} />
                      {job.location}
                    </div>
                  )}
                  {job.salary && (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                      <DollarSign size={16} style={{ marginRight: '8px' }} />
                      {job.salary}
                    </div>
                  )}
                  {job.deadline && (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                      <Clock size={16} style={{ marginRight: '8px' }} />
                      Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => viewJobDetails(job.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Eye size={16} style={{ marginRight: '8px' }} />
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            <Briefcase size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>{searchTerm ? 'No jobs found matching your search.' : 'No job openings available at the moment.'}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Jobs;