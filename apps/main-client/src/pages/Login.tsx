import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-hero">
        <div className="auth-hero-grid" />
        <h1>Every user action,<br /><span>captured instantly.</span></h1>
        <p>
          Beacon signs and delivers auth events to your webhook pipeline the moment they happen —
          registrations, logins, password changes, and more.
        </p>
        <div className="auth-hero-events">
          {['user.registered', 'user.login', 'user.password_changed', 'user.logout', 'user.deleted'].map(e => (
            <div className="event-pill" key={e}>
              <span className="event-pill-dot" />
              {e}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-brand" style={{ position: 'relative', alignSelf: 'flex-start', marginBottom: 48, top: 0, left: 0 }}>
          <span className="auth-brand-dot" />
          Beacon
        </div>

        <div className="auth-card">
          <h2>Sign in</h2>
          <p className="subtitle">Welcome back — enter your credentials to continue.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider">or</div>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}