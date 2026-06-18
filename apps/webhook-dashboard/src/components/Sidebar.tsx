import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Overview',   icon: '▦' },
  { to: '/logs',      label: 'Event logs', icon: '≡' },
  { to: '/deliveries',label: 'Deliveries', icon: '⇅' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-gem" />
        Webhook
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">{user?.email}</div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%' }}
          onClick={handleLogout}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}