import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-hero">
        <div className="auth-hero-grid" />
        <h1>Built-in webhook<br /><span>observability.</span></h1>
        <p>
          Every auth event your users trigger is signed with HMAC-SHA256, queued for reliable delivery,
          and tracked with full retry history in your webhook dashboard.
        </p>
        <div className="auth-hero-events">
          {[
            { label: 'user.registered',       color: '#34d399' },
            { label: 'user.login',            color: '#7c6af7' },
            { label: 'user.password_changed', color: '#fbbf24' },
            { label: 'user.logout',           color: '#64748b' },
            { label: 'user.deleted',          color: '#f87171' },
          ].map(({ label, color }) => (
            <div className="event-pill" key={label}>
              <span className="event-pill-dot" style={{ background: color }} />
              {label}
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
          <h2>Create account</h2>
          <p className="subtitle">Get started — it takes less than a minute.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

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
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create account'}
            </button>
          </form>

          <div className="auth-divider">or</div>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}