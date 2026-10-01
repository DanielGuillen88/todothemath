import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calculator, LogOut, User, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logotipo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600/30 rounded-lg transition-colors">
            <Calculator className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">ToDoTheMath</span>
        </Link>

        {/* Navegación según estado de sesión */}
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden sm:flex items-center gap-2 text-sm text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                <User className="w-4 h-4 text-indigo-400" />
                <span>{user.name}</span>
              </span>

              <Link
                to="/projects/new"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Proyecto</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm font-medium p-2 rounded-lg hover:bg-slate-800 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                Registrarse
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}