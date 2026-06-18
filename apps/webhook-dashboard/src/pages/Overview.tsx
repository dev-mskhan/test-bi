import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { whApi } from '../api';
import { useSocket } from '../hooks/useSocket';
import Badge from '../components/Badge';

interface Stats {
  summary: {
    total_events: string;
    delivered: string;
    failed: string;
    pending: string;
  };
  avgResponseMs: string | null;
  eventBreakdown: Array<{ event_type: string; count: string }>;
  recentActivity: Array<{
    id: string;
    event_type: string;
    status: string;
    created_at: string;
    response_time: number | null;
    attempt: number | null;
  }>;
}

export default function Overview() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef              = useSocket();
  const navigate               = useNavigate();
  const { user, endpoint }     = useAuth();

  useEffect(() => {
    whApi.stats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Listen for real-time updates and refresh stats
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    function refresh() {
      whApi.stats().then(({ data }) => setStats(data)).catch(console.error);
    }

    socket.on('log:update', refresh);
    socket.on('delivery:update', refresh);

    return () => {
      socket.off('log:update', refresh);
      socket.off('delivery:update', refresh);
    };
  }, [socketRef.current]);

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠</div>
        <h3>Failed to load stats</h3>
        <p>Check your connection and try again</p>
      </div>
    );
  }

  const { summary, avgResponseMs, eventBreakdown, recentActivity } = stats;

  return (
    <>
      <h1 className="page-title">Overview</h1>
      <p className="page-sub">
        Real-time webhook monitoring &nbsp;
        <span className="live-dot" />
      </p>

      {/* ── Your Account & Credentials ── */}
      {user && (
        <div className="card" style={{ marginBottom: 28, borderLeft: '4px solid var(--accent2)' }}>
          <div className="card-header">
            <span className="card-title">Your Account</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div className="stat-label">Name</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</div>
            </div>
            <div>
              <div className="stat-label">Email</div>
              <div style={{ fontSize: 14 }}>{user.email}</div>
            </div>
            {endpoint && (
              <>
                <div>
                  <div className="stat-label">Webhook ID</div>
                  <div className="mono" style={{ fontSize: 14 }}>{endpoint.webhook_id}</div>
                </div>
                <div>
                  <div className="stat-label">Webhook Secret</div>
                  <div className="mono" style={{ fontSize: 14 }}>{endpoint.webhook_secret}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{Number(summary.total_events).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Delivered</div>
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>
            {Number(summary.delivered).toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>
            {Number(summary.failed).toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Response</div>
          <div className="stat-value">
            {avgResponseMs ? `${avgResponseMs}ms` : '—'}
          </div>
          <div className="stat-sub">Delivery round-trip</div>
        </div>
      </div>

      {/* ── Two-column area ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Event Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Event Breakdown</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th style={{ textAlign: 'right' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {eventBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={2} className="empty-state" style={{ padding: 32 }}>
                    No events yet
                  </td>
                </tr>
              ) : (
                eventBreakdown.map((e) => (
                  <tr key={e.event_type}>
                    <td><span className="mono">{e.event_type}</span></td>
                    <td style={{ textAlign: 'right' }}>{Number(e.count).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-state" style={{ padding: 32 }}>
                    No activity yet
                  </td>
                </tr>
              ) : (
                recentActivity.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/logs/${r.id}`)}>
                    <td><span className="mono">{r.event_type}</span></td>
                    <td><Badge status={r.status} /></td>
                    <td style={{ textAlign: 'right', color: 'var(--text2)', fontSize: 12 }}>
                      {new Date(r.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
