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

  // Extraemos de forma segura el nombre y email contemplando distintos formatos del objeto user
  const displayName = 
    user?.name || 
    user?.user?.name || 
    user?.username || 
    user?.user?.username || 
    (user?.email ? user.email.split('@')[0] : '');

  const displayEmail = 
    user?.email || 
    user?.user?.email || 
    '';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logotipo: TDTM en pantallas estrechas, ToDoTheMath en pantallas normales */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600/30 rounded-lg transition-colors">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight text-white hidden sm:inline">
            ToDoTheMath
          </span>
          <span className="font-bold text-lg tracking-tight text-white inline sm:hidden">
            TDTMath
          </span>
        </Link>

        {/* Navegación según estado de sesión */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Tarjeta con Usuario Logueado (Siempre visible, sin recortarse) */}
              <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 rounded-xl shadow-inner shrink-0">
                {/* <div className="w-7 h-7 rounded-lg bg-indigo-600/80 border border-indigo-500/40 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div> */}
                <div className="text-left flex flex-col justify-center">
                  <p className="text-xs font-semibold text-white leading-tight whitespace-nowrap">
                    Hola, {displayName}! 👋🏻
                  </p>
                  {displayEmail && (
                    <p className="text-[10px] text-slate-400 leading-tight whitespace-nowrap hidden md:block">
                      {displayEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Botón Crear Proyecto */}
              <Link
                to="/projects/new"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-colors shadow-sm shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Proyecto</span>
              </Link>

              {/* Botón Cerrar Sesión */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors px-2 py-1.5"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
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