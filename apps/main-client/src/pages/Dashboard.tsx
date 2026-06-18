import React, { useState, FormEvent } from 'react';
import { useAuth } from '../AuthContext';
import { authApi } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [pwMsg,      setPwMsg]      = useState('');
  const [pwError,    setPwError]    = useState('');
  const [pwLoading,  setPwLoading]  = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    setPwError(''); setPwMsg('');
    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwMsg('Password updated successfully.');
      setCurrentPw(''); setNewPw('');
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleDelete() {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await authApi.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete account');
      setDeleteLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span className="auth-brand-dot" />
          <span style={{ fontWeight: 600, fontSize: 16 }}>Beacon</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px' }}>Account</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 14 }}>
          Manage your profile and security settings.
        </p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17 }}>{user?.name}</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 2 }}>{user?.email}</div>
            <div style={{
              display: 'inline-block', marginTop: 10,
              padding: '3px 10px', borderRadius: 100,
              background: 'rgba(124,106,247,0.15)',
              border: '1px solid rgba(124,106,247,0.3)',
              color: 'var(--accent2)', fontSize: 12, fontFamily: 'var(--mono)',
            }}>
              {user?.role}
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ width: 'auto', padding: '8px 16px', fontSize: 14 }}
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Change password</div>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
          Choose a strong password you haven't used before.
        </div>

        {pwMsg   && <div className="alert alert-success" style={{ marginBottom: 16 }}>{pwMsg}</div>}
        {pwError && <div className="alert alert-error"   style={{ marginBottom: 16 }}>{pwError}</div>}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current password</label>
            <input
              className="form-input"
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>New password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 8 characters"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={pwLoading}
            style={{ width: 'auto', padding: '10px 24px' }}>
            {pwLoading ? <span className="spinner" /> : 'Update password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: 'rgba(248,113,113,0.25)' }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--error)' }}>Danger zone</div>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
          Permanently deletes your account and all associated data. This fires a
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', margin: '0 4px' }}>user.deleted</span>
          webhook event.
        </div>
        <button
          className="btn"
          style={{
            width: 'auto', padding: '10px 24px',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            color: 'var(--error)',
          }}
          onClick={handleDelete}
          disabled={deleteLoading}
        >
          {deleteLoading ? <span className="spinner" /> : 'Delete account'}
        </button>
      </div>
    </div>
  );
}