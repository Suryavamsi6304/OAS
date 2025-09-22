import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Card } from '../common';

const UserForm = ({ 
  user = null, 
  onSubmit, 
  onCancel, 
  loading = false,
  batches = [] 
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: user || {
      username: '',
      email: '',
      password: '',
      name: '',
      role: 'learner',
      batchCode: ''
    }
  });

  return (
    <Card>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
        {user ? 'Edit User' : 'Create User'}
      </h3>
      
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Username
          </label>
          <input
            {...register('username', { required: 'Username is required' })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          {errors.username && (
            <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.username.message}</span>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Email
          </label>
          <input
            {...register('email', { 
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
            })}
            type="email"
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          {errors.email && (
            <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.email.message}</span>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Name
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
          {errors.name && (
            <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.name.message}</span>
          )}
        </div>

        {!user && (
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Password
            </label>
            <input
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
              type="password"
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            {errors.password && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.password.message}</span>
            )}
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Role
          </label>
          <select
            {...register('role', { required: 'Role is required' })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          >
            <option value="learner">Learner</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Batch Code
          </label>
          <input
            {...register('batchCode')}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            placeholder="Optional"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="secondary" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {user ? 'Update' : 'Create'} User
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UserForm;