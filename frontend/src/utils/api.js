import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000/api/v1",
    withCredentials: true,
});

// Interceptor removed as cookie is handled by browser


export default api;
