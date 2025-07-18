/**
 * api.ts
 *
 * This file acts as a mock backend API for the application.
 * It uses the browser's localStorage to persist data, simulating a database.
 * This allows the application to function without a real backend server,
 * making it easy to run and test locally. All "API" methods are asynchronous
 * to mimic real network requests.
 */
import { User, Role, QuizSession } from '../types';

// Defines the keys used to store data in localStorage.
const DB_KEYS = {
    USERS: 'math_trainer_users',
    SESSIONS: 'math_trainer_sessions'
};

// Types for credentials and signup data for better type safety.
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignUpData {
    name: string;
    email: string;
    password: string;
    role: Role;
}


/**
 * Helper function to retrieve and parse data from localStorage.
 * @param key The localStorage key.
 * @returns An array of the specified type, or an empty array if not found or on error.
 */
const getFromDb = <T>(key: string): T[] => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Error reading from localStorage key "${key}"`, e);
        return [];
    }
};

/**
 * Helper function to save data to localStorage.
 * @param key The localStorage key.
 * @param data The data (array) to be saved.
 */
const saveToDb = <T>(key: string, data: T[]): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error writing to localStorage key "${key}"`, e);
    }
};

// The main API object that centralizes all data-related operations.
export const api = {
    /**
     * Initializes the database. If no users exist, it creates a default admin user.
     * This ensures the application is usable immediately after setup.
     */
    initialize: (): void => {
        const users = getFromDb<User>(DB_KEYS.USERS);
        if (users.length === 0) {
            const adminUser: User = {
                id: 'admin_user',
                name: 'Admin',
                email: 'admin@mathtrainer.com',
                password: 'admin', // NOTE: Never store plain text passwords in a real app.
                role: Role.Admin,
            };
            saveToDb(DB_KEYS.USERS, [adminUser]);
            console.log('Default admin user created. Email: admin@mathtrainer.com, Pass: admin');
        }
    },

    /**
     * Simulates a user login.
     * @param credentials The user's email and password.
     * @returns The User object on success.
     * @throws An error if credentials are invalid.
     */
    login: async ({ email, password }: LoginCredentials): Promise<User> => {
        const users = getFromDb<User>(DB_KEYS.USERS);
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error('Invalid email or password.');
        }
        return user;
    },

    /**
     * Simulates user registration.
     * @param data The new user's details.
     * @throws An error if the email already exists.
     */
    signup: async (data: SignUpData): Promise<void> => {
        const users = getFromDb<User>(DB_KEYS.USERS);
        if (users.some(u => u.email === data.email)) {
            throw new Error('An account with this email already exists.');
        }
        const newUser: User = {
            id: `user_${Date.now()}`,
            ...data
        };
        users.push(newUser);
        saveToDb(DB_KEYS.USERS, users);
    },

    // --- User CRUD Operations ---

    getUsers: async (): Promise<User[]> => {
        return getFromDb<User>(DB_KEYS.USERS);
    },
    
    addUser: async (user: User): Promise<User> => {
        const users = getFromDb<User>(DB_KEYS.USERS);
        if (users.some(u => u.email === user.email && u.id !== user.id)) {
            throw new Error('User with this email already exists.');
        }
        users.push(user);
        saveToDb(DB_KEYS.USERS, users);
        return user;
    },

    updateUser: async (updatedUser: User): Promise<User> => {
        let users = getFromDb<User>(DB_KEYS.USERS);
        const userIndex = users.findIndex(u => u.id === updatedUser.id);
        if (userIndex === -1) {
            throw new Error('User not found.');
        }

        const originalUser = users[userIndex];
        // Keep the original password if the new one is empty/not provided.
        if (!updatedUser.password) {
            updatedUser.password = originalUser.password;
        }

        users[userIndex] = updatedUser;
        saveToDb(DB_KEYS.USERS, users);
        return updatedUser;
    },

    deleteUser: async (userId: string): Promise<void> => {
        let users = getFromDb<User>(DB_KEYS.USERS);
        users = users.filter(u => u.id !== userId);
        saveToDb(DB_KEYS.USERS, users);
    },

    // --- Quiz Session Operations ---

    /**
     * Retrieves all quiz sessions for a specific user, sorted by date descending.
     * @param userId The ID of the user.
     * @returns A promise that resolves to an array of QuizSession objects.
     */
    getQuizSessionsByUserId: async (userId: string): Promise<QuizSession[]> => {
        const sessions = getFromDb<QuizSession>(DB_KEYS.SESSIONS);
        return sessions.filter(s => s.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    /**
     * Saves a completed quiz session to the database.
     * @param session The QuizSession object to save.
     */
    saveQuizSession: async (session: QuizSession): Promise<void> => {
        const sessions = getFromDb<QuizSession>(DB_KEYS.SESSIONS);
        sessions.push(session);
        saveToDb(DB_KEYS.SESSIONS, sessions);
    }
};
