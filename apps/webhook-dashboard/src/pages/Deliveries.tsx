import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { whApi } from '../api';
import { useSocket } from '../hooks/useSocket';
import Badge from '../components/Badge';

interface Delivery {
  id: string;
  log_id: string;
  attempt: number;
  status: string;
  response_status: number | null;
  response_body: string | null;
  response_time: number | null;
  error_message: string | null;
  delivered_at: string | null;
  created_at: string;
  event_type: string;
  log_status: string;
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading]       = useState(true);
  const socketRef                    = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';

  function fetchDeliveries() {
    const params: Record<string, unknown> = {};
    if (status) params.status = status;

    whApi.deliveries(params)
      .then(({ data }) => setDeliveries(data.deliveries))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchDeliveries(); }, [status]);

  // Real-time updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('delivery:update', fetchDeliveries);
    return () => { socket.off('delivery:update', fetchDeliveries); };
  }, [socketRef.current]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  }

  return (
    <>
      <h1 className="page-title">Deliveries</h1>
      <p className="page-sub">Webhook delivery attempts and their outcomes</p>

      {/* ── Filters ── */}
      <div className="filters">
        <select
          id="filter-delivery-status"
          className="filter-select"
          value={status}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="retrying">Retrying</option>
          <option value="processing">Processing</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Attempt</th>
              <th>Status</th>
              <th>HTTP</th>
              <th>Time</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                  <span className="spinner" />
                </td>
              </tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h3>No deliveries found</h3>
                    <p>Deliveries will appear when webhooks are processed</p>
                  </div>
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id}>
                  <td><span className="mono">{d.event_type}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="mono">#{d.attempt}</span>
                  </td>
                  <td><Badge status={d.status} /></td>
                  <td>
                    {d.response_status ? (
                      <span className="mono">{d.response_status}</span>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {d.response_time != null ? (
                      <span className="mono">{d.response_time}ms</span>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
