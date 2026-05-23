export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">404 - Page Not Found</h2>
        <p className="text-slate-500 mb-6">The page you are looking for does not exist or has been moved.</p>
        <a 
          href="/" 
          className="inline-flex justify-center rounded-xl text-sm font-semibold py-2.5 px-4 bg-indigo-600 text-white hover:bg-indigo-500 transition-all w-full"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
