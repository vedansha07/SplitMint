import { Link, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      {/* Spacer to prevent content from hiding under the fixed bar */}
      <div className="h-20 md:hidden w-full" />
      
      {/* Fixed bottom navigation strictly for mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-gray-950/95 backdrop-blur-md border-t border-gray-800 flex justify-around items-center h-[72px] pb-safe z-40">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            path === '/dashboard' || path.startsWith('/groups') ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Dashboard</span>
        </Link>
        
        <Link 
          to="/history" 
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            path === '/history' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="text-xl">📊</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
        </Link>
      </nav>
    </>
  );
};
