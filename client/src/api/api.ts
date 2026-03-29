import axios from 'axios';

// Ensure the baseURL doesn't end with a trailing slash to avoid double slashes in routes
const rawBaseURL = process.env.REACT_APP_API_URL || '';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const API = axios.create({
  baseURL: baseURL
});

export default API;
