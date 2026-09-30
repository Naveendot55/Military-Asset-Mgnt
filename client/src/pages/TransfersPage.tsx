import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Base, EquipmentType, FormattedTransfer } from '../types';
import { ArrowLeftRight, Plus, Filter, X, CheckCircle, AlertCircle } from 'lucide-react';

const transferFormSchema = z
  .object({
    sourceBaseId: z.string().min(1, 'Source base is required'),
    destinationBaseId: z.string().min(1, 'Destination base is required'),
    equipmentTypeId: z.string().min(1, 'Equipment type is required'),
    quantity: z.coerce.number().int().positive('Quantity must be an integer greater than 0'),
    transferDate: z.string().min(1, 'Transfer date is required'),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.sourceBaseId !== data.destinationBaseId, {
    message: 'Source and destination base cannot be the same',
    path: ['destinationBaseId'],
  });

type TransferFormData = z.infer<typeof transferFormSchema>;

export const TransfersPage: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<FormattedTransfer[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [filterBaseId, setFilterBaseId] = useState(user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '');
  const [filterEquipmentId, setFilterEquipmentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal & Feedback
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      sourceBaseId: user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '',
      transferDate: new Date().toISOString().split('T')[0],
      referenceNumber: `TRF-${Date.now().toString().slice(-6)}`,
    },
  });

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [bRes, eRes] = await Promise.all([api.get('/bases'), api.get('/equipment')]);
        if (bRes.data.success) setBases(bRes.data.data);
        if (eRes.data.success) setEquipment(eRes.data.data);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBaseId) params.append('baseId', filterBaseId);
      if (filterEquipmentId) params.append('equipmentTypeId', filterEquipmentId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await api.get(`/transfers?${params.toString()}`);
      if (res.data.success) {
        setTransfers(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [filterBaseId, filterEquipmentId, startDate, endDate, page]);

  const onSubmit = async (data: TransferFormData) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post('/transfers', data);
      if (res.data.success) {
        setActionSuccess('Inter-base transfer verified and atomically executed.');
        reset();
        setIsModalOpen(false);
        fetchTransfers();
      }
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || 'Transfer failed. Check source base available inventory.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-sky-400" />
            Inter-Base Asset Transfers
          </h1>
          <p className="text-sm text-slate-400">
            Atomic reallocations across bases with dual-ledger audit verification
          </p>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Transfer</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-950/70 border border-emerald-800 rounded-lg p-3 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 w-full text-slate-300 font-medium text-xs mb-1">
          <Filter className="w-3.5 h-3.5 text-sky-500" />
          <span>Filter Transfer History</span>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">Base</label>
          <select
            value={filterBaseId}
            disabled={user?.role === 'BASE_COMMANDER'}
            onChange={(e) => {
              setFilterBaseId(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
          >
            {user?.role !== 'BASE_COMMANDER' && <option value="">All Bases</option>}
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">Equipment</label>
          <select
            value={filterEquipmentId}
            onChange={(e) => {
              setFilterEquipmentId(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
          >
            <option value="">All Equipment</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Source Base</th>
                <th className="px-4 py-3 font-semibold">Destination Base</th>
                <th className="px-4 py-3 font-semibold">Equipment</th>
                <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Authorized By</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    Loading transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No transfer transactions recorded.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/50">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-rose-300">{t.sourceBase}</td>
                    <td className="px-4 py-3 font-medium text-emerald-300">{t.destinationBase}</td>
                    <td className="px-4 py-3 text-white font-medium">{t.equipment}</td>
                    <td className="px-4 py-3 text-right font-bold text-white font-mono">
                      {t.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{t.reference || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{t.user}</td>
                    <td className="px-4 py-3">
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono font-semibold">
                        {t.status}
                      </span>
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

      {/* Create Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold">Initiate Inter-Base Transfer</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-3 bg-rose-950/70 border border-rose-800 rounded-lg p-2.5 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Source Base *
                  </label>
                  <select
                    {...register('sourceBaseId')}
                    disabled={user?.role === 'BASE_COMMANDER'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="">Select Origin</option>
                    {bases.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {errors.sourceBaseId && (
                    <p className="text-xs text-rose-400 mt-1">{errors.sourceBaseId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Destination Base *
                  </label>
                  <select
                    {...register('destinationBaseId')}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="">Select Destination</option>
                    {bases.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {errors.destinationBaseId && (
                    <p className="text-xs text-rose-400 mt-1">{errors.destinationBaseId.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Equipment Type *
                </label>
                <select
                  {...register('equipmentTypeId')}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">Select Equipment</option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.category})
                    </option>
                  ))}
                </select>
                {errors.equipmentTypeId && (
                  <p className="text-xs text-rose-400 mt-1">{errors.equipmentTypeId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 10"
                    {...register('quantity')}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                  />
                  {errors.quantity && <p className="text-xs text-rose-400 mt-1">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Transfer Date *
                  </label>
                  <input
                    type="date"
                    {...register('transferDate')}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                  />
                  {errors.transferDate && (
                    <p className="text-xs text-rose-400 mt-1">{errors.transferDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Reference Code / Manifest
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRF-2026-901"
                  {...register('referenceNumber')}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Operational Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for transfer, convoy routing, or security notes..."
                  {...register('notes')}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Transferring...' : 'Execute Atomic Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
