import apiClient from '../../services/apiClient';

export const getOrders = async () => {
  return await apiClient.get('/orders');
};
