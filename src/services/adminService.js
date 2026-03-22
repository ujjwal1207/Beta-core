import api from './api';

const adminService = {
    // Get platform stats
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // List all users with optional search
    getUsers: async (skip = 0, limit = 500, search = '') => {
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

    // Update user role
    updateUserRole: async (userId, role) => {
        const response = await api.patch(`/admin/users/${userId}/role`, { role });
        return response.data;
    },

    // Deactivate user
    deleteUser: async (userId) => {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data;
    },

    // Get one user profile with moderation stats
    getUserProfile: async (userId) => {
        const response = await api.get(`/admin/users/${userId}/profile`);
        return response.data;
    },

    // Get posts authored by a specific user
    getUserPosts: async (userId, skip = 0, limit = 50, includeStories = false) => {
        const response = await api.get(`/admin/users/${userId}/posts`, {
            params: {
                skip,
                limit,
                include_stories: includeStories,
            },
        });
        return response.data;
    },

    // Get comments authored by a specific user
    getUserComments: async (userId, skip = 0, limit = 50) => {
        const response = await api.get(`/admin/users/${userId}/comments`, {
            params: { skip, limit },
        });
        return response.data;
    },

    // Delete post/comment/reaction
    deleteActivity: async (type, id) => {
        const response = await api.delete(`/admin/activities/${type}/${id}`);
        return response.data;
    },

    // List recent activities
    getActivities: async (skip = 0, limit = 500) => {
        const response = await api.get('/admin/activities', { params: { skip, limit } });
        return response.data;
    },

    // List transactions
    getTransactions: async (skip = 0, limit = 500, paymentStatus = '') => {
        const params = { skip, limit };
        if (paymentStatus) params.payment_status = paymentStatus;
        const response = await api.get('/admin/transactions', { params });
        return response.data;
    },

    // ===== University Admin =====
    getUniversityDashboard: async () => {
        const response = await api.get('/admin/university/dashboard');
        return response.data;
    },

    createOrUpdateInstitution: async (name) => {
        const response = await api.post('/admin/university/institution', { name });
        return response.data;
    },

    getInstitution: async () => {
        const response = await api.get('/admin/university/institution');
        return response.data;
    },

    approveAlumni: async (userId) => {
        const response = await api.patch(`/admin/university/alumni/${userId}/approve`);
        return response.data;
    },

    removeAlumni: async (userId) => {
        const response = await api.delete(`/admin/university/alumni/${userId}`);
        return response.data;
    },

    removeStudent: async (userId) => {
        const response = await api.delete(`/admin/university/students/${userId}`);
        return response.data;
    },

    createUniversityPost: async (payload) => {
        const response = await api.post('/admin/university/posts', payload);
        return response.data;
    },

    getUniversityPosts: async (skip = 0, limit = 50) => {
        const response = await api.get('/admin/university/posts', { params: { skip, limit } });
        return response.data;
    },

    getPendingEducation: async () => {
        const response = await api.get('/admin/education/pending');
        return response.data;
    },

    processEducationApproval: async (userId, eduId, action) => {
        const response = await api.post(`/admin/education/${userId}/${eduId}/${action}`);
        return response.data;
    }
};

export default adminService;
