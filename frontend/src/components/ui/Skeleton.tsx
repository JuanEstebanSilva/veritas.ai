import React from 'react';

/** Bloque de carga con la forma del contenido final. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span aria-hidden="true" className={`skeleton block ${className}`} />
);

/** Filas de lista/tabla en carga. */
export const SkeletonRows: React.FC<{ rows?: number; className?: string }> = ({ rows = 4, className = '' }) => (
  <div className={`flex flex-col ${className}`} aria-busy="true" aria-label="Cargando">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className={`flex items-center gap-5 py-4 border-b hair ${i === 0 ? 'border-t' : ''}`}>
        <Skeleton className="h-6 w-12" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-[46%]" />
          <Skeleton className="h-3 w-[28%]" />
        </div>
        <Skeleton className="hidden sm:block h-3 w-16" />
      </div>
    ))}
  </div>
);
