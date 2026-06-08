import { cn } from '@/lib/cn';
import { Table, Td, Th } from './table';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md bg-slate-200/70', className)} />;
}

/** A placeholder table body while data loads. */
export function TableSkeleton({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <Table>
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <Th key={i}>
              <Skeleton className="h-3 w-16" />
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <Td key={c}>
                <Skeleton className="h-3.5 w-full max-w-[120px]" />
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
