import api from './api';

const adminService = {
    // Get platform stats
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // List all users with optional search
    getUsers: async (skip = 0, limit = 50, search = '') => {
        const params = { skip, limit };
        if (search) params.search = search;
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    // Toggle super linker status
    toggleSuperLinker: async (userId) => {
        const response = await api.post(`/admin/users/${userId}/toggle-super-linker`);
        return response.data;
    },

    // List recent activities
    getActivities: async (skip = 0, limit = 50) => {
        const response = await api.get('/admin/activities', { params: { skip, limit } });
        return response.data;
    },

    // List transactions
    getTransactions: async (skip = 0, limit = 50, paymentStatus = '') => {
        const params = { skip, limit };
        if (paymentStatus) params.payment_status = paymentStatus;
        const response = await api.get('/admin/transactions', { params });
        return response.data;
    },
};

export default adminService;
