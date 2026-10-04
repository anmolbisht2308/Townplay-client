/** Route-level loading skeletons: shown instantly while a server page streams in. */
export function GridSkeleton({ heading = true }: { heading?: boolean }) {
  return (
    <div data-wide className="space-y-6 pt-6" aria-busy="true">
      {heading && (
        <div className="space-y-3">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-10 w-72 max-w-full" />
        </div>
      )}
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-10 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="skeleton h-16 w-full rounded-2xl" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="overflow-hidden rounded-2xl border bg-card">
            <div className="skeleton aspect-[16/10] rounded-none" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div data-wide className="space-y-6 pt-6" aria-busy="true">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton -mx-4 h-52 rounded-none md:mx-0 md:h-72 md:rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-3">
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}
