import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Base, EquipmentType, DashboardMetrics, DashboardCharts, NetMovementBreakdown } from '../types';
import { FilterBar } from '../components/FilterBar';
import { NetMovementModal } from '../components/NetMovementModal';
import {
  Boxes,
  ArrowRightLeft,
  UserCheck,
  Flame,
  Archive,
  BarChart3,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [bases, setBases] = useState<Base[]>([]);
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);

  // Filter state
  const [selectedBaseId, setSelectedBaseId] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dashboard Data
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);

  // Net Movement Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [netMovementData, setNetMovementData] = useState<NetMovementBreakdown | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch reference metadata (bases and equipment)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [bRes, eRes] = await Promise.all([
          api.get('/bases'),
          api.get('/equipment'),
        ]);
        if (bRes.data.success) setBases(bRes.data.data);
        if (eRes.data.success) setEquipment(eRes.data.data);
      } catch (err) {
        console.error('Error fetching base/equipment lists:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch dashboard metrics based on active filters
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBaseId) params.append('baseId', selectedBaseId);
      if (selectedEquipmentId) params.append('equipmentTypeId', selectedEquipmentId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/dashboard?${params.toString()}`);
      if (res.data.success) {
        setMetrics(res.data.data.metrics);
        setCharts(res.data.data.charts);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedBaseId, selectedEquipmentId, startDate, endDate]);

  // Handle Net Movement Metric Click
  const handleOpenNetMovementModal = async () => {
    setModalOpen(true);
    setModalLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBaseId) params.append('baseId', selectedBaseId);
      if (selectedEquipmentId) params.append('equipmentTypeId', selectedEquipmentId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/dashboard/net-movement?${params.toString()}`);
      if (res.data.success) {
        setNetMovementData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch net movement details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedBaseId('');
    setSelectedEquipmentId('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            Operational Logistics Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time auditable asset balances, movements, and command allocations
          </p>
        </div>
      </div>

      {/* Operational Filter Bar */}
      <FilterBar
        bases={bases}
        equipment={equipment}
        selectedBaseId={selectedBaseId}
        selectedEquipmentId={selectedEquipmentId}
        startDate={startDate}
        endDate={endDate}
        onBaseChange={setSelectedBaseId}
        onEquipmentChange={setSelectedEquipmentId}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={handleResetFilters}
      />

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Aggregating inventory metrics from database...</p>
        </div>
      ) : metrics ? (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Opening Balance */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Opening Balance</span>
                <Archive className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {metrics.openingBalance.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Starting baseline inventory</p>
            </div>

            {/* 2. Net Movement (CLICKABLE BONUS) */}
            <div
              onClick={handleOpenNetMovementModal}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleOpenNetMovementModal();
              }}
              className="bg-slate-900 border border-emerald-500/40 hover:border-emerald-500 rounded-xl p-5 shadow-sm cursor-pointer transition relative group hover:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  Net Movement
                  <Info className="w-3 h-3 text-emerald-400" />
                </span>
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <div
                className={`text-2xl font-black ${
                  metrics.netMovement >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.netMovement >= 0 ? `+${metrics.netMovement}` : metrics.netMovement}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Purchases + In - Out</span>
                <span className="text-emerald-400 font-semibold group-hover:underline text-[10px]">
                  View Details →
                </span>
              </p>
            </div>

            {/* 3. Assigned */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Assigned</span>
                <UserCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-sky-400">
                {metrics.assigned.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Issued to active personnel</p>
            </div>

            {/* 4. Expended */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Expended</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {metrics.expended.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Consumed / live training</p>
            </div>

            {/* 5. Closing Balance */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm bg-gradient-to-br from-slate-900 to-slate-950">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">Closing Balance</span>
                <Boxes className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {metrics.closingBalance.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Net remaining available stock</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Chart 1: Inventory by Equipment */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Available Inventory by Equipment Type
                </div>
              </div>
              <div className="h-64 w-full">
                {charts && charts.equipmentInventory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.equipmentInventory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#34d399' }}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Units" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No equipment data found for current filters
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Base-wise Inventory */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  Base-wise Inventory Distribution
                </div>
              </div>
              <div className="h-64 w-full">
                {charts && charts.baseInventory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.baseInventory} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#38bdf8' }}
                      />
                      <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Total Assets" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No base distribution available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Movement Over Time Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Inventory Movement Over Time (Purchases vs Net Transfers)
              </div>
            </div>
            <div className="h-64 w-full">
              {charts && charts.movementOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.movementOverTime} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="purchases" stroke="#10b981" strokeWidth={2} name="Purchases" />
                    <Line type="monotone" dataKey="transfers" stroke="#f59e0b" strokeWidth={2} name="Net Transfers" />
                    <Line type="monotone" dataKey="net" stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 5" name="Net Shift" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No historical trend points recorded in selected period
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
          Failed to load dashboard data.
        </div>
      )}

      {/* Accessible Net Movement Bonus Modal */}
      <NetMovementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={netMovementData}
        isLoading={modalLoading}
      />
    </div>
  );
};
