import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * @param {string} message — user-facing explanation + what to do next
 * @param {() => void} [onRetry] — if provided, shows a Retry button
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50/90 p-6 flex flex-col sm:flex-row sm:items-start gap-4"
      role="alert"
    >
      <div className="shrink-0 text-red-600 pt-0.5">
        <AlertCircle className="w-8 h-8" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-900 mb-1">Something went wrong</p>
        <p className="text-sm text-red-800 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
