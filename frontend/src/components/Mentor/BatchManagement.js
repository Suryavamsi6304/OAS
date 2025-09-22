import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const BatchManagement = () => {
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    code: '',
    name: '',
    description: ''
  });

  const { data: batches, isLoading, refetch } = useQuery('mentor-batches', async () => {
    const response = await api.get('/api/batches');
    return response.data.data || [];
  });

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/batches', batchForm);
      toast.success('Batch created successfully');
      setShowBatchForm(false);
      setBatchForm({ code: '', name: '', description: '' });
      refetch();
    } catch (error) {
      toast.error('Failed to create batch');
    }
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/batches/${editingBatch.id}`, batchForm);
      toast.success('Batch updated successfully');
      setEditingBatch(null);
      setShowBatchForm(false);
      setBatchForm({ code: '', name: '', description: '' });
      refetch();
    } catch (error) {
      toast.error('Failed to update batch');
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await api.delete(`/api/batches/${batchId}`);
      toast.success('Batch deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete batch');
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setBatchForm({
      code: batch.code,
      name: batch.name,
      description: batch.description || ''
    });
    setShowBatchForm(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            Batch Management
          </h2>
          <button 
            onClick={() => setShowBatchForm(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Plus size={16} style={{ marginRight: '8px' }} />
            Create Batch
          </button>
        </div>

        {isLoading ? (
          <p>Loading batches...</p>
        ) : batches?.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {batches.map((batch) => (
              <div 
                key={batch.id} 
                className="card" 
                style={{ 
                  margin: 0,
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                      {batch.code}
                    </h3>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: batch.isActive ? '#dcfce7' : '#fef2f2',
                      color: batch.isActive ? '#166534' : '#dc2626'
                    }}>
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <h4 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>
                    {batch.name}
                  </h4>
                  
                  {batch.description && (
                    <p style={{ color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                      {batch.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>Created by:</span>
                    <span>{batch.creator?.name || 'Unknown'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>Created:</span>
                    <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEditBatch(batch)}
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Edit size={16} style={{ marginRight: '8px' }} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBatch(batch.id)}
                    className="btn btn-danger"
                    style={{ padding: '8px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No batches created yet.</p>
            <button 
              onClick={() => setShowBatchForm(true)}
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
            >
              Create Your First Batch
            </button>
          </div>
        )}
      </div>

      {/* Batch Form Modal */}
      {showBatchForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90vw' }}>
            <h3 style={{ marginBottom: '20px' }}>
              {editingBatch ? 'Edit Batch' : 'Create New Batch'}
            </h3>
            
            <form onSubmit={editingBatch ? handleUpdateBatch : handleCreateBatch}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Batch Code</label>
                <input
                  type="text"
                  value={batchForm.code}
                  onChange={(e) => setBatchForm({...batchForm, code: e.target.value})}
                  className="form-input"
                  placeholder="e.g., BATCH001"
                  required
                  disabled={editingBatch} // Don't allow editing code
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Batch Name</label>
                <input
                  type="text"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({...batchForm, name: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Full Stack Development"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                <textarea
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({...batchForm, description: e.target.value})}
                  className="form-input"
                  placeholder="Brief description of the batch"
                  rows="3"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowBatchForm(false);
                    setEditingBatch(null);
                    setBatchForm({ code: '', name: '', description: '' });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBatch ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;