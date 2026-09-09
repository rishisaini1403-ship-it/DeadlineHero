import api from './api';

export const studyGroupService = {
  async lookupUser(email) {
    const res = await api.get('/invitations/lookup', { params: { email } });
    return res.data.data;
  },

  async sendInvitation(email) {
    const res = await api.post('/invitations/send', { email });
    return res.data.data;
  },

  async getMyInvitations() {
    const res = await api.get('/invitations/my');
    return res.data.data || [];
  },

  async getSentInvitations() {
    const res = await api.get('/invitations/sent');
    return res.data.data || [];
  },

  async respondToInvitation(id, action) {
    const res = await api.put(`/invitations/${id}/respond`, { action });
    return res.data.data;
  },

  async getConnections() {
    const res = await api.get('/invitations/connections');
    return res.data.data;
  },
};
