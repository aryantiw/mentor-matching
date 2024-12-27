// Constants
const API_URL = '/api';
const ELEMENTS = {
    forms: {
        login: document.getElementById('login'),
        register: document.getElementById('register'),
        profile: document.getElementById('profile')
    },
    containers: {
        authForms: document.getElementById('authForms'),
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        profileForm: document.getElementById('profileForm'),
        searchSection: document.getElementById('searchSection'),
        searchResults: document.getElementById('searchResults')
    },
    buttons: {
        login: document.getElementById('loginBtn'),
        register: document.getElementById('registerBtn'),
        profile: document.getElementById('profileBtn'),
        search: document.getElementById('searchBtn'),
        logout: document.getElementById('logoutBtn'),
        searchSubmit: document.getElementById('searchSubmit')
    },
    toast: document.getElementById('toast')
};

// Token Management
const TokenService = {
    get: () => localStorage.getItem('token'),
    set: (token) => localStorage.setItem('token', token),
    remove: () => localStorage.removeItem('token'),
    exists: () => !!localStorage.getItem('token')
};

// API Service
class ApiService {
    static async request(endpoint, options = {}) {
        const token = TokenService.get();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Auth endpoints
    static async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        TokenService.set(data.token);
        return data;
    }

    static async register(email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    // Profile endpoints
    static async getProfile() {
        return this.request('/profile');
    }

    static async updateProfile(profileData) {
        return this.request('/profile', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
    }

    // Search endpoints
    static async searchUsers(params) {
        return this.request(`/profile/search?${new URLSearchParams(params)}`);
    }

    // Mentorship endpoints
    static async sendMentorshipRequest(mentorId, message) {
        return this.request('/mentorship/request', {
            method: 'POST',
            body: JSON.stringify({ mentorId, message })
        });
    }

    static async updateMentorshipRequest(requestId, status) {
        return this.request(`/mentorship/request/${requestId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }
}

// UI Manager
class UIManager {
    static showToast(message, type = 'info') {
        const toast = ELEMENTS.toast;
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    static showAuthenticatedUI() {
        ELEMENTS.containers.authForms.classList.add('hidden');
        ELEMENTS.buttons.login.classList.add('hidden');
        ELEMENTS.buttons.register.classList.add('hidden');
        ELEMENTS.buttons.profile.classList.remove('hidden');
        ELEMENTS.buttons.search.classList.remove('hidden');
        ELEMENTS.buttons.logout.classList.remove('hidden');
    }

    static showUnauthenticatedUI() {
        ELEMENTS.containers.authForms.classList.remove('hidden');
        ELEMENTS.containers.profileForm.classList.add('hidden');
        ELEMENTS.containers.searchSection.classList.add('hidden');
        ELEMENTS.buttons.login.classList.remove('hidden');
        ELEMENTS.buttons.register.classList.remove('hidden');
        ELEMENTS.buttons.profile.classList.add('hidden');
        ELEMENTS.buttons.search.classList.add('hidden');
        ELEMENTS.buttons.logout.classList.add('hidden');
    }

    static showLoginForm() {
        ELEMENTS.containers.loginForm.classList.remove('hidden');
        ELEMENTS.containers.registerForm.classList.add('hidden');
    }

    static showRegisterForm() {
        ELEMENTS.containers.loginForm.classList.add('hidden');
        ELEMENTS.containers.registerForm.classList.remove('hidden');
    }

    static showProfileForm() {
        ELEMENTS.containers.authForms.classList.add('hidden');
        ELEMENTS.containers.searchSection.classList.add('hidden');
        ELEMENTS.containers.profileForm.classList.remove('hidden');
    }

    static showSearchSection() {
        ELEMENTS.containers.authForms.classList.add('hidden');
        ELEMENTS.containers.profileForm.classList.add('hidden');
        ELEMENTS.containers.searchSection.classList.remove('hidden');
    }

    static renderSearchResults(users) {
        const resultsContainer = ELEMENTS.containers.searchResults;
        resultsContainer.innerHTML = '';

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <h3>${user.full_name}</h3>
                <p class="role">${user.role}</p>
                <p class="title">${user.current_title} at ${user.company}</p>
                <p class="experience">${user.years_of_experience} years of experience</p>
                <p class="skills">Skills: ${user.skills.join(', ')}</p>
                ${user.role === 'mentor' ? `
                    <button class="btn-primary request-mentor" data-id="${user.id}">
                        Request Mentorship
                    </button>
                ` : ''}
            `;
            resultsContainer.appendChild(userCard);
        });
    }
}

// Event Handlers
class EventHandlers {
    static async handleLogin(e) {
        e.preventDefault();
        try {
            await ApiService.login(
                document.getElementById('loginEmail').value,
                document.getElementById('loginPassword').value
            );
            UIManager.showAuthenticatedUI();
            UIManager.showToast('Logged in successfully', 'success');
        } catch (error) {
            UIManager.showToast(error.message, 'error');
        }
    }

    static async handleRegister(e) {
        e.preventDefault();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            return UIManager.showToast('Passwords do not match', 'error');
        }

        try {
            await ApiService.register(
                document.getElementById('registerEmail').value,
                password
            );
            UIManager.showToast('Registration successful. Please log in.', 'success');
            UIManager.showLoginForm();
        } catch (error) {
            UIManager.showToast(error.message, 'error');
        }
    }

    static async handleProfileUpdate(e) {
        e.preventDefault();
        try {
            const profileData = {
                role: document.getElementById('role').value,
                fullName: document.getElementById('fullName').value,
                bio: document.getElementById('bio').value,
                skills: document.getElementById('skills').value.split(',').map(s => s.trim()),
                yearsOfExperience: parseInt(document.getElementById('yearsOfExperience').value),
                currentTitle: document.getElementById('currentTitle').value,
                company: document.getElementById('company').value,
                linkedinUrl: document.getElementById('linkedinUrl').value
            };

            await ApiService.updateProfile(profileData);
            UIManager.showToast('Profile updated successfully', 'success');
        } catch (error) {
            UIManager.showToast(error.message, 'error');
        }
    }

    static async handleSearch(e) {
        e.preventDefault();
        try {
            const searchParams = {
                role: document.getElementById('searchRole').value,
                skills: document.getElementById('searchSkills').value
            };

            const results = await ApiService.searchUsers(searchParams);
            UIManager.renderSearchResults(results);
        } catch (error) {
            UIManager.showToast(error.message, 'error');
        }
    }

    static handleLogout() {
        TokenService.remove();
        UIManager.showUnauthenticatedUI();
        UIManager.showToast('Logged out successfully', 'success');
    }
}

// Initialize Application
function initializeApp() {
    // Check authentication status
    if (TokenService.exists()) {
        UIManager.showAuthenticatedUI();
    } else {
        UIManager.showUnauthenticatedUI();
    }

    // Set up event listeners
    ELEMENTS.forms.login.addEventListener('submit', EventHandlers.handleLogin);
    ELEMENTS.forms.register.addEventListener('submit', EventHandlers.handleRegister);
    ELEMENTS.forms.profile.addEventListener('submit', EventHandlers.handleProfileUpdate);
    
    ELEMENTS.buttons.login.addEventListener('click', () => UIManager.showLoginForm());
    ELEMENTS.buttons.register.addEventListener('click', () => UIManager.showRegisterForm());
    ELEMENTS.buttons.profile.addEventListener('click', () => UIManager.showProfileForm());
    ELEMENTS.buttons.search.addEventListener('click', () => UIManager.showSearchSection());
    ELEMENTS.buttons.logout.addEventListener('click', EventHandlers.handleLogout);
    ELEMENTS.buttons.searchSubmit.addEventListener('click', EventHandlers.handleSearch);

    // Handle mentor request buttons
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('request-mentor')) {
            const mentorId = e.target.dataset.id;
            const message = prompt('Enter a message for the mentor:');
            if (message) {
                try {
                    await ApiService.sendMentorshipRequest(mentorId, message);
                    UIManager.showToast('Mentorship request sent successfully', 'success');
                } catch (error) {
                    UIManager.showToast(error.message, 'error');
                }
            }
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);