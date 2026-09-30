import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Base, EquipmentType, InventoryTransaction } from '../types';
import { ShoppingCart, Plus, Filter, X, CheckCircle, AlertCircle } from 'lucide-react';

const purchaseFormSchema = z.object({
  baseId: z.string().min(1, 'Please select a base'),
  equipmentTypeId: z.string().min(1, 'Please select equipment type'),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

export const PurchasesPage: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<InventoryTransaction[]>([]);
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
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      baseId: user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '',
      purchaseDate: new Date().toISOString().split('T')[0],
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

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBaseId) params.append('baseId', filterBaseId);
      if (filterEquipmentId) params.append('equipmentTypeId', filterEquipmentId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await api.get(`/purchases?${params.toString()}`);
      if (res.data.success) {
        setPurchases(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [filterBaseId, filterEquipmentId, startDate, endDate, page]);

  const onSubmit = async (data: PurchaseFormData) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.post('/purchases', data);
      if (res.data.success) {
        setActionSuccess('Purchase order recorded and verified in inventory audit ledger.');
        reset();
        setIsModalOpen(false);
        fetchPurchases();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to submit purchase order.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            Asset Procurement & Purchases
          </h1>
          <p className="text-sm text-slate-400">
            Record newly acquired defense inventory and supplier shipments
          </p>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
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
          <Filter className="w-3.5 h-3.5 text-emerald-500" />
          <span>Filter Purchase History</span>
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
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Base</th>
                <th className="px-4 py-3 font-semibold">Equipment Type</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                <th className="px-4 py-3 font-semibold">Supplier / Ref</th>
                <th className="px-4 py-3 font-semibold">Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No purchase transactions found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/50">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {new Date(p.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{p.base?.name}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">{p.equipmentType?.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.equipmentType?.category}</td>
                    <td className="px-4 py-3 text-right font-bold text-white font-mono">
                      +{p.quantity.toLocaleString()} {p.equipmentType?.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{p.referenceId || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.user?.name}</td>
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

      {/* Create Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold">Record Equipment Purchase</h2>
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
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Receiving Base *
                </label>
                <select
                  {...register('baseId')}
                  disabled={user?.role === 'BASE_COMMANDER'}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">Select Base</option>
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                {errors.baseId && <p className="text-xs text-rose-400 mt-1">{errors.baseId.message}</p>}
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
                    placeholder="e.g. 50"
                    {...register('quantity')}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                  />
                  {errors.quantity && <p className="text-xs text-rose-400 mt-1">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    {...register('purchaseDate')}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                  />
                  {errors.purchaseDate && (
                    <p className="text-xs text-rose-400 mt-1">{errors.purchaseDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Supplier / Purchase Order Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-9901, Lockheed / GDLS"
                  {...register('supplier')}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Shipment verification details or receipt numbers..."
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
