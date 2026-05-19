import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * @param {string} title
 * @param {string} message
 * @param {string} [actionLabel] — CTA label
 * @param {() => void} [onAction] — CTA handler
 */
export default function EmptyState({ title, message, actionLabel, onAction }) {
  const showAction = Boolean(actionLabel && onAction);

  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-8 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400">
        <Inbox className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">{message}</p>
      {showAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
