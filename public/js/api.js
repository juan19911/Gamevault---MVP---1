// ===================================================
// GameVault API Client Layer (Fetch API + JWT)
// ===================================================

const API_BASE = '/api';

const API = {
    getToken() {
        return localStorage.getItem('gv_token');
    },

    setToken(token) {
        localStorage.setItem('gv_token', token);
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem('gv_user') || 'null');
        } catch {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem('gv_user', JSON.stringify(user));
    },

    logout() {
        localStorage.removeItem('gv_token');
        localStorage.removeItem('gv_user');
        window.location.reload();
    },

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers
            });

            const contentType = res.headers.get('content-type') || '';
            let data = {};
            if (contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                data = { message: text || `Error HTTP ${res.status}` };
            }

            if (!res.ok) {
                if (data && data.banned) {
                    const user = this.getUser();
                    if (user) {
                        user.status = 'banned';
                        this.setUser(user);
                        const bannerBanned = document.getElementById('banner-banned');
                        if (bannerBanned) bannerBanned.style.display = 'flex';
                    }
                }
                if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
                    // Session expired
                    this.logout();
                }
                throw new Error(data.message || `Error en la petición (${res.status})`);
            }

            // Si la consulta a /auth/profile fue exitosa, sincronizar inmediatamente el estado del usuario
            if (endpoint === '/auth/profile' && data.user) {
                const user = this.getUser() || {};
                user.status = data.user.status || 'active';
                user.role = data.user.role || user.role;
                this.setUser(user);
                const bannerBanned = document.getElementById('banner-banned');
                if (user.status === 'banned') {
                    if (bannerBanned) bannerBanned.style.display = 'flex';
                } else {
                    if (bannerBanned) bannerBanned.style.display = 'none';
                }
            }

            return data;
        } catch (err) {
            console.error(`API Error [${endpoint}]:`, err.message);
            throw err;
        }
    },

    // Auth
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            this.setToken(data.token);
            this.setUser(data.user);
        }
        return data;
    },

    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        if (data.token) {
            this.setToken(data.token);
            this.setUser(data.user);
        }
        return data;
    },

    async getProfile() {
        return await this.request('/auth/profile');
    },

    async updateProfile(profileData) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    // Games Catalog
    async getGames({ search = '', genre = '', platform = '' } = {}) {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (genre) params.append('genre', genre);
        if (platform) params.append('platform', platform);
        return await this.request(`/games?${params.toString()}`);
    },

    async getFilters() {
        return await this.request('/games/filters');
    },

    async getGameById(id) {
        return await this.request(`/games/${id}`);
    },

    // Personal Library
    async getLibrary({ status = 'all', priority = 'all', search = '' } = {}) {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (search) params.append('search', search);
        return await this.request(`/library?${params.toString()}`);
    },

    async addToLibrary(libraryData) {
        return await this.request('/library', {
            method: 'POST',
            body: JSON.stringify(libraryData)
        });
    },

    async updateLibraryEntry(id, updateData) {
        return await this.request(`/library/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    },

    async deleteLibraryEntry(id) {
        return await this.request(`/library/${id}`, {
            method: 'DELETE'
        });
    },

    // Sessions Log
    async createSession(sessionData) {
        return await this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    },

    async getSessionsByLibraryId(libraryId) {
        return await this.request(`/sessions/library/${libraryId}`);
    },

    // Stats & Discovery
    async getDashboard() {
        return await this.request('/stats/dashboard');
    },

    async getRandomGame(onlyHighPriority = false) {
        const query = onlyHighPriority ? '?priority=high' : '';
        return await this.request(`/stats/random${query}`);
    },

    async getRecommendations() {
        return await this.request('/stats/recommendations');
    },

    // Custom Lists (HU-05)
    async getMyLists() {
        return await this.request('/lists');
    },

    async getListDetails(listId) {
        return await this.request(`/lists/${listId}`);
    },

    async createList(listData) {
        return await this.request('/lists', {
            method: 'POST',
            body: JSON.stringify(listData)
        });
    },

    async addGameToList(listId, gameId) {
        return await this.request(`/lists/${listId}/items`, {
            method: 'POST',
            body: JSON.stringify({ game_id: gameId })
        });
    },

    async removeGameFromList(listId, gameId) {
        return await this.request(`/lists/${listId}/items/${gameId}`, {
            method: 'DELETE'
        });
    },

    async deleteList(listId) {
        return await this.request(`/lists/${listId}`, {
            method: 'DELETE'
        });
    },

    // Game Reviews (HU-05)
    async getGameReviews(gameId) {
        return await this.request(`/games/${gameId}/reviews`);
    },

    // ==========================================
    // ADMIN MANAGEMENT (RBAC)
    // ==========================================
    async getAdminStats() {
        return await this.request('/admin/stats');
    },

    async getAdminUsers() {
        return await this.request('/admin/users');
    },

    async updateAdminUserRole(userId, role) {
        return await this.request(`/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
    },

    async createAdminUser(userData) {
        return await this.request('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async updateAdminUser(userId, userData) {
        return await this.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    async deleteAdminUser(userId) {
        return await this.request(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    },

    async updateAdminUserStatus(userId, status) {
        return await this.request(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    async createAdminGame(gameData) {
        return await this.request('/admin/games', {
            method: 'POST',
            body: JSON.stringify(gameData)
        });
    },

    async updateAdminGame(gameId, gameData) {
        return await this.request(`/admin/games/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify(gameData)
        });
    },

    async deleteAdminGame(gameId) {
        return await this.request(`/admin/games/${gameId}`, {
            method: 'DELETE'
        });
    },

    async uploadAdminCover(base64Image, filename) {
        return await this.request('/admin/upload-cover', {
            method: 'POST',
            body: JSON.stringify({ image: base64Image, filename })
        });
    }
};
