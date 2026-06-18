import React from 'react';

const MAP: Record<string, string> = {
  success:    'badge-success',
  delivered:  'badge-success',
  failed:     'badge-failed',
  pending:    'badge-pending',
  queued:     'badge-pending',
  retrying:   'badge-retrying',
  processing: 'badge-processing',
};

export default function Badge({ status }: { status: string }) {
  const cls = MAP[status] || 'badge-pending';
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}