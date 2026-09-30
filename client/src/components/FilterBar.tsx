import React from 'react';
import { Base, EquipmentType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  bases: Base[];
  equipment: EquipmentType[];
  selectedBaseId: string;
  selectedEquipmentId: string;
  startDate: string;
  endDate: string;
  onBaseChange: (id: string) => void;
  onEquipmentChange: (id: string) => void;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  bases,
  equipment,
  selectedBaseId,
  selectedEquipmentId,
  startDate,
  endDate,
  onBaseChange,
  onEquipmentChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
}) => {
  const { user } = useAuth();
  const isBaseCommander = user?.role === 'BASE_COMMANDER';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-slate-300 font-medium text-sm">
        <Filter className="w-4 h-4 text-emerald-500" />
        <span>Operational Filters</span>
        {isBaseCommander && (
          <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded ml-2">
            Base locked to assigned command ({user?.base?.name || 'Your Base'})
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Base Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Military Base
          </label>
          <select
            value={isBaseCommander ? user?.baseId || '' : selectedBaseId}
            disabled={isBaseCommander}
            onChange={(e) => onBaseChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {!isBaseCommander && <option value="">All Bases</option>}
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Equipment Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Equipment Type
          </label>
          <select
            value={selectedEquipmentId}
            onChange={(e) => onEquipmentChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Equipment</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.category})
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Reset Action */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded px-3 py-2 text-sm font-medium transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};
