export default function TournamentDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* 헤더 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="h-8 w-2/3 bg-gray-200 rounded-lg" />
        <div className="h-4 w-1/2 bg-gray-100 rounded-lg" />
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-20 bg-gray-100 rounded-t-lg" />
        ))}
      </div>

      {/* 콘텐츠 카드 */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-12 bg-gray-100 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-full bg-gray-200" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="h-7 w-14 bg-gray-200 rounded-lg" />
              <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
