import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register }   = useAuth();
  const navigate        = useNavigate();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [webhookName, setWebhookName] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, webhookName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="logo-gem" />
          Webhook Dashboard
        </div>
        <h2>Create account</h2>
        <p>Register for dashboard access</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="register-name">Name</label>
            <input
              id="register-name"
              className="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              className="input"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="form-field">
            <label htmlFor="register-webhook-name">Webhook Name</label>
            <input
              id="register-webhook-name"
              className="input"
              type="text"
              placeholder="e.g. My Prod Webhook"
              value={webhookName}
              onChange={(e) => setWebhookName(e.target.value)}
              required
            />
          </div>
          <button
            id="register-submit"
            className="btn btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, marginBottom: 0, fontSize: 13 }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
