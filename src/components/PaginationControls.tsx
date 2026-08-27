import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = "filings",
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      onPageChange(newPage);
    }
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}
    >
      {/* Left Info: Item Count Range & Page Size Select */}
      <div className="flex flex-wrap items-center gap-3 text-[#888888] w-full sm:w-auto justify-between sm:justify-start">
        <div>
          Showing <strong className="text-white font-mono">{startIndex}</strong> to{" "}
          <strong className="text-white font-mono">{endIndex}</strong> of{" "}
          <strong className="text-emerald-400 font-mono">{totalItems}</strong> {itemLabel}
          {totalPages > 1 && (
            <span className="text-[#666666] ml-1.5">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#666666] hidden md:inline">Show:</span>
            <select
              aria-label={`Select page size for ${itemLabel}`}
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
              }}
              className="bg-[#141414] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} per page
                </option>
              ))}
              <option value={totalItems}>All ({totalItems})</option>
            </select>
          </div>
        )}
      </div>

      {/* Right Navigation: First, Prev, Page Pills, Next, Last */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
          {/* First Page Button */}
          {totalPages > 4 && (
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              title="First page"
              className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#242424] transition-colors cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#242424] text-xs font-medium transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {/* Page Number Buttons */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => {
              if (page === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-[#555555]">
                    &hellip;
                  </span>
                );
              }
              const pageNum = Number(page);
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bold"
                      : "bg-[#141414] hover:bg-[#202020] text-[#aaaaaa] hover:text-white border border-[#242424]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#242424] text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page Button */}
          {totalPages > 4 && (
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              title="Last page"
              className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#242424] transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
