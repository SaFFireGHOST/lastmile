import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  signup: (data: any) => client.post('/signup', data),
  login: (data: any) => client.post('/login', data),
  getStations: () => client.get('/stations'),
  createRiderRequest: (data: any) => client.post('/rider/request', data),
  registerDriverRoute: (data: any) => client.post('/driver/route', data),
  updateDriverLocation: (data: any) => client.post('/driver/location', data),
  getNotifications: (userId: string) => client.get(`/notifications?user_id=${userId}`),
  markNotificationRead: (notifId: string) => client.put(`/notifications/${notifId}/read`),
  markAllNotificationsRead: (userId: string) => client.put('/notifications/read-all', { user_id: userId }),
  clearNotifications: (userId: string) => client.delete(`/notifications/clear?user_id=${userId}`),
};
