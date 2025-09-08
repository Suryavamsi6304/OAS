import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BatchManagement = () => {
  const queryClient = useQueryClient();
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    code: '',
    name: '',
    description: ''
  });

  const { data: batches, isLoading } = useQuery('batches', async () => {
    const response = await axios.get('/api/batches');
    return response.data.data || [];
  });

  const createBatchMutation = useMutation(
    (batchData) => axios.post('/api/batches', batchData),
    {
      onSuccess: () => {
        toast.success('Batch created successfully');
        setShowBatchForm(false);
        setBatchForm({ code: '', name: '', description: '' });
        queryClient.invalidateQueries('batches');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create batch');
      }
    }
  );

  const updateBatchMutation = useMutation(
    ({ id, ...batchData }) => axios.put(`/api/batches/${id}`, batchData),
    {
      onSuccess: () => {
        toast.success('Batch updated successfully');
        setShowBatchForm(false);
        setEditingBatch(null);
        setBatchForm({ code: '', name: '', description: '' });
        queryClient.invalidateQueries('batches');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update batch');
      }
    }
  );

  const deleteBatchMutation = useMutation(
    (id) => axios.delete(`/api/batches/${id}`),
    {
      onSuccess: () => {
        toast.success('Batch deleted successfully');
        queryClient.invalidateQueries('batches');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete batch');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBatch) {
      updateBatchMutation.mutate({ id: editingBatch.id, ...batchForm });
    } else {
      createBatchMutation.mutate(batchForm);
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setBatchForm({
      code: batch.code,
      name: batch.name,
      description: batch.description || ''
    });
    setShowBatchForm(true);
  };

  const handleDelete = (batch) => {
    if (window.confirm(`Are you sure you want to delete batch "${batch.name}"?`)) {
      deleteBatchMutation.mutate(batch.id);
    }
  };

  return (
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Created By</th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{batch.code}</td>
                  <td style={{ padding: '12px' }}>{batch.name}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    {batch.description || 'No description'}
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>
                    {batch.creator?.name || 'Unknown'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(batch)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(batch)}
                        className="btn btn-danger"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Batch Code *
                </label>
                <input
                  type="text"
                  value={batchForm.code}
                  onChange={(e) => setBatchForm({...batchForm, code: e.target.value.toUpperCase()})}
                  className="form-input"
                  placeholder="e.g., BATCH001"
                  required
                  disabled={editingBatch} // Don't allow editing code
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Batch Name *
                </label>
                <input
                  type="text"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({...batchForm, name: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Full Stack Development - Batch 1"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({...batchForm, description: e.target.value})}
                  className="form-input"
                  placeholder="Optional description for this batch"
                  rows={3}
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
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createBatchMutation.isLoading || updateBatchMutation.isLoading}
                >
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