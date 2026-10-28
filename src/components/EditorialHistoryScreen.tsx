import React, { useState, useMemo } from 'react';
import { ScreenId, AnalysisRecord } from '../types';

interface EditorialHistoryScreenProps {
  analyses: AnalysisRecord[];
  onNavigate: (screen: ScreenId, reportId?: string) => void;
  onEditInWorkspace: (record: AnalysisRecord) => void;
  onDuplicateAnalysis: (record: AnalysisRecord) => void;
  onDeleteAnalysis: (id: string) => void;
}

type StatusFilter = 'All' | 'Completed' | 'Review required' | 'Draft' | 'Failed';
type SortOption = 'newest' | 'peak_asc' | 'savings_desc' | 'title_asc';
type ViewSimState = 'live' | 'loading' | 'empty';

export const EditorialHistoryScreen: React.FC<EditorialHistoryScreenProps> = ({
  analyses,
  onNavigate,
  onEditInWorkspace,
  onDuplicateAnalysis,
  onDeleteAnalysis,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewSimState, setViewSimState] = useState<ViewSimState>('live');
  const [recordToDelete, setRecordToDelete] = useState<AnalysisRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const pageSize = 5;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const filteredAndSorted = useMemo(() => {
    if (viewSimState === 'empty') return [];

    const q = searchQuery.trim().toLowerCase();
    const filtered = analyses.filter((item) => {
      const matchesStatus =
        statusFilter === 'All' || item.status === statusFilter;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.substationZone.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'peak_asc') return a.mitigatedPeakKw - b.mitigatedPeakKw;
      if (sortBy === 'savings_desc')
        return b.estimatedDailyDeltaUsd - a.estimatedDailyDeltaUsd;
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      return b.id.localeCompare(a.id);
    });
  }, [analyses, searchQuery, statusFilter, sortBy, viewSimState]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredAndSorted.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    const deletedId = recordToDelete.id;
    onDeleteAnalysis(deletedId);
    setRecordToDelete(null);
    triggerToast(`Deleted study ${deletedId} from ledger.`);
  };

  const handleDuplicate = (item: AnalysisRecord) => {
    onDuplicateAnalysis(item);
    triggerToast(`Duplicated ${item.id} as a new draft study.`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* TOAST */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#29251F] text-[#FCFAF6] border border-[#754536] rounded-[8px] px-4 py-3 shadow-lg flex items-center gap-3"
        >
          <span className="w-2 h-2 rounded-full bg-[#35674A]" />
          <span className="text-[13px]">{toastMsg}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DDD5C9]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
              04 / ANALYSIS ARCHIVE & LEDGER
            </span>
            <span className="text-[#DDD5C9]">·</span>
            <span className="font-mono-meta text-[11px] text-[#716A61]">
              {analyses.length} TOTAL STUDIES
            </span>
          </div>
          <h1 className="font-serif-editorial text-[32px] sm:text-[40px] leading-[1.12] text-[#29251F]">
            Analysis history
          </h1>
          <p className="text-[15px] text-[#716A61] mt-1.5 max-w-2xl">
            Search, filter, compare, and manage historical feeder load studies and human dispatch sign-offs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Interactive State Switcher to inspect Loading / Empty / Live states */}
          <div
            className="inline-flex rounded-[6px] border border-[#DDD5C9] bg-[#FCFAF6] p-0.5 text-[11px] font-mono-meta"
            role="group"
            aria-label="Preview interface states"
          >
            <button
              onClick={() => setViewSimState('live')}
              className={`px-2.5 py-1 rounded-[4px] cursor-pointer transition-colors ${
                viewSimState === 'live'
                  ? 'bg-[#29251F] text-[#FCFAF6]'
                  : 'text-[#716A61] hover:text-[#29251F]'
              }`}
            >
              Live ({analyses.length})
            </button>
            <button
              onClick={() => setViewSimState('loading')}
              className={`px-2.5 py-1 rounded-[4px] cursor-pointer transition-colors ${
                viewSimState === 'loading'
                  ? 'bg-[#29251F] text-[#FCFAF6]'
                  : 'text-[#716A61] hover:text-[#29251F]'
              }`}
            >
              Loading state
            </button>
            <button
              onClick={() => setViewSimState('empty')}
              className={`px-2.5 py-1 rounded-[4px] cursor-pointer transition-colors ${
                viewSimState === 'empty'
                  ? 'bg-[#29251F] text-[#FCFAF6]'
                  : 'text-[#716A61] hover:text-[#29251F]'
              }`}
            >
              Empty state
            </button>
          </div>

          <button
            onClick={() => onNavigate('workspace')}
            className="h-11 px-5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[14px] font-medium transition-colors cursor-pointer"
          >
            + New analysis
          </button>
        </div>
      </div>

      {/* SEARCH, STATUS FILTERS & SORT BAR */}
      <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Input */}
          <div className="md:col-span-6">
            <label htmlFor="history-search-input" className="sr-only">
              Search analysis studies by name, ID, or substation zone
            </label>
            <div className="relative">
              <input
                id="history-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by study title, ID (e.g., ANL-2026-104), or substation zone..."
                className="w-full h-11 pl-3.5 pr-9 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[14px] text-[#29251F] placeholder:text-[#716A61]/70 focus:outline-none focus:border-[#754536]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-mono-meta text-[#716A61] hover:text-[#29251F] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="md:col-span-4 flex flex-wrap items-center gap-1.5">
            {(
              ['All', 'Completed', 'Review required', 'Draft', 'Failed'] as StatusFilter[]
            ).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`h-9 px-3 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#29251F] text-[#FCFAF6]'
                    : 'bg-[#FFFFFF] border border-[#DDD5C9] text-[#716A61] hover:text-[#29251F]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <label htmlFor="history-sort-select" className="sr-only">
              Sort analyses
            </label>
            <select
              id="history-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full h-11 px-3 rounded-[6px] bg-[#FFFFFF] border border-[#DDD5C9] text-[13px] text-[#29251F] focus:outline-none focus:border-[#754536]"
            >
              <option value="newest">Sort: Newest first</option>
              <option value="peak_asc">Sort: Lowest peak (kW)</option>
              <option value="savings_desc">Sort: Highest tariff delta</option>
              <option value="title_asc">Sort: Title (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* STATE 1: LOADING SKELETON */}
      {viewSimState === 'loading' && (
        <div
          aria-busy="true"
          aria-label="Loading analysis history"
          className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] overflow-hidden divide-y divide-[#DDD5C9]"
        >
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse"
            >
              <div className="space-y-2.5 flex-1">
                <div className="h-3 w-32 bg-[#DDD5C9] rounded" />
                <div className="h-5 w-72 bg-[#DDD5C9] rounded" />
                <div className="h-3 w-48 bg-[#F3EEE5] rounded" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-24 bg-[#DDD5C9] rounded" />
                <div className="h-9 w-28 bg-[#DDD5C9] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STATE 2: EMPTY ARCHIVE STATE */}
      {viewSimState === 'empty' && (
        <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-12 text-center space-y-4">
          <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#754536]">
            ARCHIVE EMPTY
          </div>
          <h2 className="font-serif-editorial text-[28px] text-[#29251F]">
            No feeder dispatch studies recorded yet
          </h2>
          <p className="text-[15px] text-[#716A61] max-w-md mx-auto">
            Configure your first substation feeder study in the AI workspace to evaluate peak shaving and battery state-of-charge envelopes.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('workspace')}
              className="h-11 px-5 rounded-[6px] bg-[#754536] hover:bg-[#61372B] text-[#FFFFFF] text-[14px] font-medium transition-colors cursor-pointer"
            >
              Create first study
            </button>
            <button
              onClick={() => setViewSimState('live')}
              className="h-11 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] text-[#29251F] text-[14px] font-medium cursor-pointer"
            >
              Restore demo archive
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: NO FILTER RESULTS */}
      {viewSimState === 'live' && filteredAndSorted.length === 0 && (
        <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] p-10 text-center space-y-3">
          <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#716A61]">
            NO MATCHING RECORDS
          </div>
          <h2 className="font-serif-editorial text-[24px] text-[#29251F]">
            No studies match &ldquo;{searchQuery || statusFilter}&rdquo;
          </h2>
          <p className="text-[14px] text-[#716A61]">
            Try clearing your search filter or selecting &ldquo;All&rdquo; statuses.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
            className="h-10 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] hover:bg-[#F3EEE5] text-[#29251F] text-[13px] font-medium cursor-pointer"
          >
            Reset search & filters
          </button>
        </div>
      )}

      {/* STATE 4: CLEAN TABLE (DESKTOP) & STRUCTURED CARDS (MOBILE) */}
      {viewSimState === 'live' && filteredAndSorted.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DDD5C9] bg-[#F3EEE5]/70 font-mono-meta text-[11px] uppercase tracking-[0.12em] text-[#716A61]">
                  <th className="py-3.5 px-5">Analysis ID & title</th>
                  <th className="py-3.5 px-4">Substation zone</th>
                  <th className="py-3.5 px-4">Date & time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Mitigated peak</th>
                  <th className="py-3.5 px-4 text-right">Daily delta</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD5C9] text-[14px] bg-[#FFFFFF]">
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FCFAF6] transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-meta text-[12px] font-medium text-[#754536]">
                          {item.id}
                        </span>
                        {item.isIllustrativeDemo && (
                          <span className="font-mono-meta text-[10px] px-1.5 py-0.5 rounded bg-[#F3EEE5] text-[#716A61]">
                            DEMO
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onNavigate('results', item.id)}
                        className="font-medium text-[#29251F] hover:text-[#754536] text-left mt-0.5 block cursor-pointer"
                      >
                        {item.title}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-[13px] text-[#716A61]">
                      {item.substationZone}
                    </td>
                    <td className="py-4 px-4 font-mono-meta text-[12px] text-[#716A61] whitespace-nowrap">
                      {item.createdAt}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-mono-meta text-[11px] ${
                          item.status === 'Completed'
                            ? 'bg-[#35674A]/10 text-[#35674A]'
                            : item.status === 'Review required'
                            ? 'bg-[#754536]/12 text-[#754536]'
                            : item.status === 'Failed'
                            ? 'bg-[#A43E35]/12 text-[#A43E35]'
                            : 'bg-[#315B85]/12 text-[#315B85]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono-meta text-[13px] text-[#29251F] tabular-nums">
                      {item.mitigatedPeakKw.toFixed(1)} kW
                      <span className="block text-[11px] text-[#716A61]">
                        cap {item.feederCapKw} kW
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono-meta text-[13px] text-[#35674A] tabular-nums">
                      ${item.estimatedDailyDeltaUsd.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onNavigate('results', item.id)}
                          className="h-8 px-2.5 rounded-[4px] bg-[#F3EEE5] hover:bg-[#754536] hover:text-[#FFFFFF] text-[#29251F] text-[12px] font-medium transition-colors cursor-pointer"
                        >
                          Report
                        </button>
                        <button
                          onClick={() => onEditInWorkspace(item)}
                          className="h-8 px-2.5 rounded-[4px] border border-[#DDD5C9] bg-[#FFFFFF] hover:bg-[#F3EEE5] text-[#29251F] text-[12px] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(item)}
                          className="h-8 px-2.5 rounded-[4px] border border-[#DDD5C9] bg-[#FFFFFF] hover:bg-[#F3EEE5] text-[#716A61] hover:text-[#29251F] text-[12px] cursor-pointer"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => setRecordToDelete(item)}
                          className="h-8 px-2.5 rounded-[4px] border border-transparent hover:border-[#A43E35]/40 text-[#A43E35] text-[12px] cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards (< 768px) */}
          <div className="md:hidden space-y-4">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#FFFFFF] border border-[#DDD5C9] rounded-[8px] p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-meta text-[12px] font-medium text-[#754536]">
                    {item.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] font-mono-meta text-[11px] ${
                      item.status === 'Completed'
                        ? 'bg-[#35674A]/10 text-[#35674A]'
                        : item.status === 'Review required'
                        ? 'bg-[#754536]/12 text-[#754536]'
                        : 'bg-[#315B85]/12 text-[#315B85]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-[16px] text-[#29251F]">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-[#716A61] mt-0.5">
                    {item.substationZone} · {item.createdAt}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DDD5C9] font-mono-meta text-[12px]">
                  <div>
                    <span className="text-[#716A61] block text-[10px]">
                      MITIGATED PEAK
                    </span>
                    <span className="text-[#29251F]">
                      {item.mitigatedPeakKw.toFixed(1)} kW
                    </span>
                  </div>
                  <div>
                    <span className="text-[#716A61] block text-[10px]">
                      EST. DAILY DELTA
                    </span>
                    <span className="text-[#35674A]">
                      ${item.estimatedDailyDeltaUsd.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DDD5C9]">
                  <button
                    onClick={() => onNavigate('results', item.id)}
                    className="h-9 px-3 rounded-[4px] bg-[#754536] text-[#FFFFFF] text-[12px] font-medium cursor-pointer"
                  >
                    View report
                  </button>
                  <button
                    onClick={() => onEditInWorkspace(item)}
                    className="h-9 px-3 rounded-[4px] border border-[#DDD5C9] bg-[#FCFAF6] text-[#29251F] text-[12px] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(item)}
                    className="h-9 px-3 rounded-[4px] border border-[#DDD5C9] bg-[#FCFAF6] text-[#716A61] text-[12px] cursor-pointer"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => setRecordToDelete(item)}
                    className="h-9 px-3 rounded-[4px] text-[#A43E35] text-[12px] ml-auto cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-[13px] text-[#716A61]">
            <div>
              Showing{' '}
              <span className="font-mono-meta text-[#29251F]">
                {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredAndSorted.length)}
              </span>{' '}
              of{' '}
              <span className="font-mono-meta text-[#29251F]">
                {filteredAndSorted.length}
              </span>{' '}
              studies
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-9 px-3 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] disabled:opacity-40 text-[#29251F] text-[12px] font-mono-meta cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono-meta text-[12px] px-2 text-[#29251F]">
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="h-9 px-3 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] disabled:opacity-40 text-[#29251F] text-[12px] font-mono-meta cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {recordToDelete && (
        <div
          className="fixed inset-0 z-50 bg-[#29251F]/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="bg-[#FCFAF6] border border-[#DDD5C9] rounded-[10px] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#A43E35]">
              DESTRUCTIVE ACTION CONFIRMATION
            </div>
            <h3
              id="delete-modal-title"
              className="font-serif-editorial text-[24px] text-[#29251F]"
            >
              Delete study {recordToDelete.id}?
            </h3>
            <p className="text-[14px] text-[#716A61] leading-[1.6]">
              You are about to remove <strong className="text-[#29251F]">{recordToDelete.title}</strong> from the analysis history. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="h-10 px-4 rounded-[6px] border border-[#DDD5C9] bg-[#FFFFFF] text-[#29251F] text-[13px] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="h-10 px-4 rounded-[6px] bg-[#A43E35] hover:bg-[#8d332b] text-[#FFFFFF] text-[13px] font-medium cursor-pointer"
              >
                Delete study
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
