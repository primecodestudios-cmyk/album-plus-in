import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header skeleton */}
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-10 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </header>

    <main className="container mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <Skeleton className="w-10 h-10 rounded-xl mb-3" />
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Content Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card lg:col-span-2">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
);

export const StoreCardSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  </div>
);

export const StoreGridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
    {[...Array(8)].map((_, i) => (
      <StoreCardSkeleton key={i} />
    ))}
  </div>
);

export const DownloadCardSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border p-5 shadow-card flex flex-col">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
    <Skeleton className="h-4 w-3/4 mb-1" />
    <Skeleton className="h-3 w-full mb-1" />
    <Skeleton className="h-3 w-2/3 mb-4" />
    <Skeleton className="h-3 w-1/2 mb-4" />
    <Skeleton className="h-9 w-full rounded-xl" />
  </div>
);

export const DownloadSectionSkeleton = () => (
  <div className="space-y-12">
    {[...Array(3)].map((_, i) => (
      <div key={i}>
        <div className="flex items-center gap-3 mb-5">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, j) => (
            <DownloadCardSkeleton key={j} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const LandingSectionSkeleton = () => (
  <div className="py-16">
    <div className="container mx-auto px-4">
      <div className="text-center mb-10">
        <Skeleton className="h-6 w-32 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-8 w-72 mx-auto mb-3" />
        <Skeleton className="h-4 w-96 mx-auto max-w-full" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <Skeleton className="w-12 h-12 rounded-xl mb-4" />
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
