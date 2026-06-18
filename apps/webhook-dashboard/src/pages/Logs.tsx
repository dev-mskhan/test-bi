import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { whApi } from '../api';
import { useSocket } from '../hooks/useSocket';
import Badge from '../components/Badge';

interface Log {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
  webhook_id: string;
  endpoint_name: string;
  user_email?: string | null;
  user_name?: string | null;
  data_preview: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Logs() {
  const [logs, setLogs]             = useState<Log[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const socketRef                    = useSocket();
  const navigate                     = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page   = parseInt(searchParams.get('page')   || '1');
  const event  = searchParams.get('event')  || '';
  const status = searchParams.get('status') || '';

  const fetchLogs = useCallback(() => {
    const params: Record<string, unknown> = { page, limit: 20 };
    if (event)  params.event  = event;
    if (status) params.status = status;

    whApi.logs(params)
      .then(({ data }) => {
        setLogs(data.logs);
        setPagination(data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, event, status]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Real-time updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('log:update', fetchLogs);
    return () => { socket.off('log:update', fetchLogs); };
  }, [socketRef.current, fetchLogs]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  return (
    <>
      <h1 className="page-title">Event Logs</h1>
      <p className="page-sub">All inbound webhook events</p>

      {/* ── Filters ── */}
      <div className="filters">
        <select
          id="filter-event"
          className="filter-select"
          value={event}
          onChange={(e) => setFilter('event', e.target.value)}
        >
          <option value="">All events</option>
          <option value="user.registered">user.registered</option>
          <option value="user.login">user.login</option>
          <option value="user.logout">user.logout</option>
          <option value="user.password_changed">user.password_changed</option>
          <option value="user.deleted">user.deleted</option>
        </select>

        <select
          id="filter-status"
          className="filter-select"
          value={status}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Event Type</th>
              <th>User</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                  <span className="spinner" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3>No events found</h3>
                    <p>Adjust your filters or wait for incoming webhooks</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} onClick={() => navigate(`/logs/${log.id}`)}>
                  <td><span className="mono">{log.event_type}</span></td>
                  <td>
                    {log.user_name || log.user_email ? (
                      <>
                        {log.user_name ? <strong>{log.user_name}</strong> : null}
                        {log.user_name && log.user_email ? ' ' : null}
                        {log.user_email ? <span className="mono">&lt;{log.user_email}&gt;</span> : null}
                      </>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>No user</span>
                    )}
                  </td>
                  <td>{log.endpoint_name}</td>
                  <td><Badge status={log.status} /></td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        {pagination && pagination.pages > 1 && (
          <div className="pagination">
            <span>
              Page {pagination.page} of {pagination.pages}
              &nbsp;·&nbsp;{pagination.total} total
            </span>
            <div className="pagination-btns">
              <button
                className="btn btn-ghost btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => setFilter('page', String(pagination.page - 1))}
              >
                ← Prev
              </button>
              <button
                className="btn btn-ghost btn-sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setFilter('page', String(pagination.page + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
