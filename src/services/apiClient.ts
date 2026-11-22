import axios from "axios";
import { getSession } from "./authSession";

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 5000
});

apiClient.interceptors.request.use((config) => {
    const token = getSession()?.token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});
