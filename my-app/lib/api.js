// my-app/lib/api.js

const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

const api = {
    async request(endpoint, options = {}) {
        const url = `${getApiUrl()}${endpoint}`;
        const token = localStorage.getItem('authToken');

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            // Handle cases with no content
            if (response.status === 204) {
                return null;
            }
            return response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    get(endpoint, options) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint, body, options) {
        return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    },

    put(endpoint, body, options) {
        return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    },

    delete(endpoint, options) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    },
};

export default api;
