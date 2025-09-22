import { useApiQuery, useApiMutation } from './useApi';
import { userService } from '../services';

export const useUsers = () => {
  return useApiQuery('users', () => userService.getUsers());
};

export const useCreateUser = () => {
  return useApiMutation(
    (userData) => userService.createUser(userData),
    {
      successMessage: 'User created successfully!',
      invalidateQueries: ['users']
    }
  );
};

export const useUpdateUser = () => {
  return useApiMutation(
    ({ id, data }) => userService.updateUser(id, data),
    {
      successMessage: 'User updated successfully!',
      invalidateQueries: ['users']
    }
  );
};

export const useDeleteUser = () => {
  return useApiMutation(
    (id) => userService.deleteUser(id),
    {
      successMessage: 'User deleted successfully!',
      invalidateQueries: ['users']
    }
  );
};

export const useApproveUser = () => {
  return useApiMutation(
    ({ id, approved }) => userService.approveUser(id, approved),
    {
      successMessage: (data, { approved }) => 
        approved ? 'User approved successfully!' : 'User rejected successfully!',
      invalidateQueries: ['users', 'pending-approvals']
    }
  );
};

export const usePendingApprovals = () => {
  return useApiQuery('pending-approvals', () => userService.getPendingApprovals());
};