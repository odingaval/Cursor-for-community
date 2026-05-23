export function RoomLoading({ message = "Loading workspace…" }: { message?: string }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-surface gap-4">
      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-300 font-medium">{message}</p>
      <p className="text-gray-500 text-sm max-w-sm text-center px-4">
        First visit loads Monaco Editor (~30s in dev). Later loads are much faster.
      </p>
    </div>
  );
}
