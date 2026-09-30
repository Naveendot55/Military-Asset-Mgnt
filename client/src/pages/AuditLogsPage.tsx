import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog } from '../types';
import { ShieldCheck, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction) params.append('action', filterAction);
      if (filterEntity) params.append('entity', filterEntity);
      params.append('page', page.toString());
      params.append('limit', '15');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity, page]);

  const getActionBadge = (action: string) => {
    if (action.includes('PURCHASE')) {
      return (
        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
          {action}
        </span>
      );
    }
    if (action.includes('TRANSFER')) {
      return (
        <span className="bg-sky-950 text-sky-300 border border-sky-800 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
          {action}
        </span>
      );
    }
    if (action.includes('ASSIGNMENT')) {
      return (
        <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
          {action}
        </span>
      );
    }
    if (action.includes('EXPENDITURE')) {
      return (
        <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
          {action}
        </span>
      );
    }
    if (action.includes('LOGIN_SUCCESS')) {
      return (
        <span className="bg-teal-950 text-teal-300 border border-teal-800 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
          {action}
        </span>
      );
    }
    if (action.includes('LOGIN_FAILED')) {
      return (
        <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
          {action}
        </span>
      );
    }
    return (
      <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-400" />
          Immutable Security & Audit Ledger
        </h1>
        <p className="text-sm text-slate-400">
          Cryptographically recorded operational events, transaction logs, and authentication attempts
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 w-full text-slate-300 font-medium text-xs mb-1">
          <Filter className="w-3.5 h-3.5 text-purple-400" />
          <span>Filter Audit Records</span>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">Action</label>
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
          >
            <option value="">All Actions</option>
            <option value="PURCHASE_CREATED">PURCHASE_CREATED</option>
            <option value="TRANSFER_CREATED">TRANSFER_CREATED</option>
            <option value="ASSIGNMENT_CREATED">ASSIGNMENT_CREATED</option>
            <option value="EXPENDITURE_CREATED">EXPENDITURE_CREATED</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="BASE_CREATED">BASE_CREATED</option>
            <option value="EQUIPMENT_CREATED">EQUIPMENT_CREATED</option>
          </select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">Entity</label>
          <select
            value={filterEntity}
            onChange={(e) => {
              setFilterEntity(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
          >
            <option value="">All Entities</option>
            <option value="InventoryTransaction">InventoryTransaction</option>
            <option value="User">User</option>
            <option value="Base">Base</option>
            <option value="EquipmentType">EquipmentType</option>
          </select>
        </div>

        {(filterAction || filterEntity) && (
          <button
            onClick={() => {
              setFilterAction('');
              setFilterEntity('');
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Actor / Officer</th>
                <th className="px-4 py-3 font-semibold">Entity / Target</th>
                <th className="px-4 py-3 font-semibold">Base Context</th>
                <th className="px-4 py-3 font-semibold">IP Address</th>
                <th className="px-4 py-3 font-semibold">Metadata Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No audit records found matching query.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-850/50">
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap font-mono">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{getActionBadge(l.action)}</td>
                    <td className="px-4 py-3 text-xs">
                      {l.user ? (
                        <div>
                          <div className="text-white font-medium">{l.user.name}</div>
                          <div className="text-slate-500 font-mono text-[10px]">{l.user.role}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">System / Anonymous</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-slate-300 font-medium">{l.entity}</span>
                      {l.entityId && (
                        <div className="text-slate-500 font-mono text-[10px] truncate max-w-[120px]">
                          {l.entityId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-medium">
                      {l.base ? `${l.base.name} (${l.base.code})` : 'Global / Multi'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{l.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 max-w-xs">
                      {l.metadata ? (
                        <pre className="text-[11px] bg-slate-950 p-1.5 rounded border border-slate-800 overflow-x-auto">
                          {typeof l.metadata === 'object'
                            ? JSON.stringify(l.metadata, null, 2)
                            : l.metadata}
                        </pre>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-slate-800 rounded disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-slate-800 rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
