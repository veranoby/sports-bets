import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // The vite proxy in vite.config.ts will handle this
  headers: {
    'Content-Type': 'application/json'
  }
});

// Optional: Add interceptors for handling tokens or errors globally.
/*
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*/

export default api;

const apiCall = async (method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any) => {
    try {
      let response;
      if (method === 'get' || method === 'delete') {
        response = await api[method](endpoint, { params: data });
      } else {
        response = await api[method](endpoint, data);
      }
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error at ${endpoint}:`, error);
      const errorMessage = error.response?.data?.message || error.message;
      return { success: false, error: errorMessage, code: error.response?.status };
    }
}


export const fightsAPI = {
  openBetting: async (fightId: string) => {
    return apiCall('post', `/fights/${fightId}/open-betting`);
  },
  closeBetting: async (fightId: string) => {
    return apiCall('post', `/fights/${fightId}/close-betting`);
  },
  recordResult: async (fightId: string, result: { winner: 'red' | 'blue' | 'draw', notes?: string }) => {
    return apiCall('post', `/fights/${fightId}/result`, result);
  },
};



export const adminAPI = {
  updateUserMembership: async (userId: string, data: { membership_type: string, assigned_username: string }) => {
    const response = await api.put(`/admin/users/${userId}/membership`, data);
    return response.data;
  },
};

export const userAPI = {
  uploadPaymentProof: async (formData: FormData) => {
    const response = await api.post('/users/upload-payment-proof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

export const authAPI = {
  checkMembershipStatus: async () => {
    const response = await api.post('/auth/check-membership-status');
    return response;
  },
};
