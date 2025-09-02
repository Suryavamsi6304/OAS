import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Building, Clock, Send, Upload } from 'lucide-react';
import DashboardLayout from '../Layout/DashboardLayout';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Job Details Component
 */
const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [documents, setDocuments] = useState([]);

  // Fetch job details
  const { data: job, isLoading } = useQuery(['job', id], async () => {
    const response = await axios.get(`/api/jobs/${id}`);
    return response.data.data;
  });

  // Apply for job mutation
  const applyMutation = useMutation(
    async (applicationData) => {
      return await axios.post('/api/jobs/apply', applicationData);
    },
    {
      onSuccess: () => {
        toast.success('Application submitted successfully!');
        queryClient.invalidateQueries('my-applications');
        navigate('/employee/applications');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit application');
      }
    }
  );

  const handleApply = () => {
    applyMutation.mutate({
      jobId: id,
      documents
    });
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file) // In real app, upload to server
    }));
    setDocuments([...documents, ...newDocs]);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Job Details">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <p>Loading job details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout title="Job Details">
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <p>Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Job Details">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/employee')}
          className="btn btn-secondary"
          style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Jobs
        </button>

        {/* Job Header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              {job.title}
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              Posted by {job.creator?.name} • {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Job Meta Info */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            {job.department && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Building size={20} style={{ color: '#6b7280', marginRight: '8px' }} />
                <span>{job.department}</span>
              </div>
            )}
            {job.location && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <MapPin size={20} style={{ color: '#6b7280', marginRight: '8px' }} />
                <span>{job.location}</span>
              </div>
            )}
            {job.salary && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DollarSign size={20} style={{ color: '#6b7280', marginRight: '8px' }} />
                <span>{job.salary}</span>
              </div>
            )}
            {job.deadline && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Clock size={20} style={{ color: '#6b7280', marginRight: '8px' }} />
                <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Job Description
            </h3>
            <p style={{ lineHeight: '1.6', color: '#374151' }}>
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                Requirements
              </h3>
              <p style={{ lineHeight: '1.6', color: '#374151' }}>
                {job.requirements}
              </p>
            </div>
          )}
        </div>

        {/* Application Form */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Apply for this Position
          </h2>

          {/* Document Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Upload Documents (Resume, Cover Letter, etc.)
            </label>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <Upload size={32} style={{ color: '#6b7280', margin: '0 auto 12px' }} />
              <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                Drag and drop files here, or click to select
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleDocumentUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="btn btn-secondary"
                style={{ cursor: 'pointer' }}
              >
                Choose Files
              </label>
            </div>

            {/* Uploaded Documents */}
            {documents.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Uploaded Documents:
                </h4>
                {documents.map((doc, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{doc.name}</span>
                    <button
                      onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleApply}
            disabled={applyMutation.isLoading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '16px',
              padding: '12px'
            }}
          >
            <Send size={16} style={{ marginRight: '8px' }} />
            {applyMutation.isLoading ? 'Submitting...' : 'Submit Application'}
          </button>

          <p style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            textAlign: 'center', 
            marginTop: '12px',
            margin: '12px 0 0 0'
          }}>
            By applying, you agree to our terms and conditions
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobDetails;