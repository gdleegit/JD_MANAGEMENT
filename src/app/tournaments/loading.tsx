export default function TournamentsLoading() {
  return (
    <div>
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden animate-pulse"
            style={{ border: "1.5px solid #e2e8f0", borderTop: "4px solid #e2e8f0" }}
          >
            <div className="bg-white p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-14 bg-gray-200 rounded-full" />
                <div className="flex gap-1.5">
                  <div className="h-5 w-12 bg-gray-100 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded-lg w-3/4" />
              <div className="h-4 bg-gray-100 rounded-lg w-full" />
              <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
              <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <div className="h-3 w-10 bg-gray-100 rounded" />
                <div className="h-3 w-10 bg-gray-100 rounded" />
                <div className="h-3 w-10 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
