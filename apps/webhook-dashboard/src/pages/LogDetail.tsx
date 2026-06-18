import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { whApi } from '../api';
import { useSocket } from '../hooks/useSocket';
import Badge from '../components/Badge';

interface Delivery {
  id: string;
  attempt: number;
  status: string;
  response_status: number | null;
  response_body: string | null;
  response_time: number | null;
  error_message: string | null;
  delivered_at: string | null;
  created_at: string;
}

interface LogDetail {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
  status: string;
  created_at: string;
  webhook_id: string;
  endpoint_name: string;
  deliveries: Delivery[];
}

export default function LogDetailPage() {
  const { id }                    = useParams<{ id: string }>();
  const [log, setLog]             = useState<LogDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const socketRef                  = useSocket();

  function fetchLog() {
    if (!id) return;
    whApi.log(id)
      .then(({ data }) => setLog(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchLog(); }, [id]);

  // Real-time updates for this specific log
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    function onLogUpdate(data: { logId: string }) {
      if (data.logId === id) fetchLog();
    }
    function onDeliveryUpdate(data: { logId: string }) {
      if (data.logId === id) fetchLog();
    }

    socket.on('log:update', onLogUpdate);
    socket.on('delivery:update', onDeliveryUpdate);

    return () => {
      socket.off('log:update', onLogUpdate);
      socket.off('delivery:update', onDeliveryUpdate);
    };
  }, [socketRef.current, id]);

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3>Log not found</h3>
        <p>This event may have been deleted</p>
      </div>
    );
  }

  const deliveries = (log.deliveries || []).sort(
    (a: Delivery, b: Delivery) => a.attempt - b.attempt
  );

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <Link to="/logs" style={{ fontSize: 13, color: 'var(--text2)' }}>
          ← Back to logs
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          <span className="mono">{log.event_type}</span>
        </h1>
        <Badge status={log.status} />
      </div>

      <p className="page-sub">
        {log.endpoint_name} · {new Date(log.created_at).toLocaleString()}
      </p>

      {/* ── Detail Panel ── */}
      <div className="detail-panel">
        {/* Payload */}
        <div className="detail-section">
          <h3>Payload</h3>
          <div className="json-block">
            {JSON.stringify(log.payload, null, 2)}
          </div>
        </div>

        {/* Headers */}
        <div className="detail-section">
          <h3>Request Headers</h3>
          <div className="json-block">
            {JSON.stringify(log.headers, null, 2)}
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="detail-section">
          <h3>Delivery Attempts ({deliveries.length})</h3>

          {deliveries.length === 0 ? (
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>
              No delivery attempts yet
            </p>
          ) : (
            <div className="timeline">
              {deliveries.map((d: Delivery) => {
                const dotClass = `timeline-dot timeline-dot-${
                  d.status === 'delivered' ? 'success' :
                  d.status === 'failed'    ? 'failed'  :
                  d.status === 'retrying'  ? 'retrying' : 'pending'
                }`;

                return (
                  <div key={d.id} className="timeline-item">
                    <div className={dotClass}>#{d.attempt}</div>
                    <div className="timeline-body">
                      <div className="timeline-title">
                        <Badge status={d.status} />
                        {d.response_status && (
                          <span
                            className="mono"
                            style={{ marginLeft: 10, color: 'var(--text2)', fontSize: 12 }}
                          >
                            HTTP {d.response_status}
                          </span>
                        )}
                        {d.response_time != null && (
                          <span style={{ marginLeft: 10, color: 'var(--text2)', fontSize: 12 }}>
                            {d.response_time}ms
                          </span>
                        )}
                      </div>
                      <div className="timeline-meta">
                        {d.delivered_at
                          ? `Delivered at ${new Date(d.delivered_at).toLocaleString()}`
                          : new Date(d.created_at).toLocaleString()
                        }
                        {d.error_message && (
                          <span style={{ color: 'var(--red)', marginLeft: 8 }}>
                            — {d.error_message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
