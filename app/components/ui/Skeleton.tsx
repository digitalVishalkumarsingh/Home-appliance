"use client";

import { cn } from "@/app/lib/utils";

/**
 * Props for the Skeleton component.
 */
interface SkeletonProps {
  /** Additional Tailwind CSS classes for customization. */
  className?: string;
  /** Width of the skeleton (e.g., '100px', '50%', 'full'). */
  width?: string;
  /** Height of the skeleton (e.g., '20px', '2rem', 'full'). */
  height?: string;
  /** Border radius class (e.g., 'rounded-md', 'rounded-full'). Defaults to 'rounded-md'. */
  rounded?: string;
  /** Whether to apply pulse animation. Defaults to true. */
  animate?: boolean;
}

/**
 * A reusable skeleton component for displaying loading placeholders.
 * @param props - The component props.
 */
export function Skeleton({
  className,
  width,
  height,
  rounded = "rounded-md",
  animate = true,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700",
        animate && "animate-pulse",
        rounded,
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * A skeleton component for a card layout.
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

/**
 * A skeleton component for a profile layout.
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6 dark:bg-gray-700">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="sm:col-span-1">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

/**
 * A skeleton component for a table row layout.
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

/**
 * A skeleton component for a dashboard layout.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-gray-200 p-3 dark:bg-gray-700">
                  <Skeleton className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Chart Section */}
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:bg-gray-700">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="p-6">
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * A skeleton component for a booking layout.
 */
export function BookingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:bg-gray-700">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="space-y-6 p-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b pb-4 last:border-b-0">
              <div className="mb-2 flex justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}