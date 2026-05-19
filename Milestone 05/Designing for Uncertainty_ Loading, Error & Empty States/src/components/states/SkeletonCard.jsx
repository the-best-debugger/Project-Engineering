import React from 'react';

const shimmerBar = 'rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer';

/**
 * Loading placeholders for list / grid / table / stat layouts.
 * @param {number} count — how many skeleton units to render
 * @param {'order'|'product'|'stat'|'table-row'} variant — layout shape
 */
export default function SkeletonCard({ count = 4, variant = 'order' }) {
  const slots = Array.from({ length: count }, (_, i) => i);

  if (variant === 'product') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slots.map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse"
          >
            <div className={`w-full h-32 mb-4 ${shimmerBar}`} />
            <div className={`h-5 ${shimmerBar} w-3/4 mb-3`} />
            <div className={`h-3 ${shimmerBar} w-1/3 mb-4`} />
            <div className="flex justify-between">
              <div className={`h-3 ${shimmerBar} w-20`} />
              <div className={`h-3 ${shimmerBar} w-16`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {slots.map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between animate-pulse"
          >
            <div className="flex-1">
              <div className={`h-3 ${shimmerBar} w-24 mb-3`} />
              <div className={`h-8 ${shimmerBar} w-32`} />
            </div>
            <div className={`h-12 w-12 rounded-full ${shimmerBar}`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <>
        {slots.map((i) => (
          <tr key={i} className="animate-pulse">
            <td className="px-6 py-4">
              <div className={`h-4 ${shimmerBar} w-40 mb-2`} />
              <div className={`h-3 ${shimmerBar} w-56`} />
            </td>
            <td className="px-6 py-4">
              <div className={`h-4 ${shimmerBar} w-16`} />
            </td>
            <td className="px-6 py-4">
              <div className={`h-4 ${shimmerBar} w-24`} />
            </td>
            <td className="px-6 py-4 text-right">
              <div className={`h-8 ${shimmerBar} w-20 inline-block rounded-lg`} />
            </td>
          </tr>
        ))}
      </>
    );
  }

  // default: order card row
  return (
    <div className="grid grid-cols-1 gap-4">
      {slots.map((i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center animate-pulse"
        >
          <div>
            <div className={`h-4 ${shimmerBar} w-28 mb-2`} />
            <div className={`h-3 ${shimmerBar} w-40`} />
          </div>
          <div className="text-right">
            <div className={`h-4 ${shimmerBar} w-16 mb-2 ml-auto`} />
            <div className={`h-5 ${shimmerBar} w-20 rounded-full ml-auto`} />
          </div>
        </div>
      ))}
    </div>
  );
}
