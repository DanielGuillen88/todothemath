import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calculator, LogOut, PlusCircle, Check, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutFeedback, setLogoutFeedback] = useState(null);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setLogoutFeedback('Sesión cerrada con éxito. ¡Hasta pronto!');

    // Mostramos el mensaje durante 2 segundos y luego ejecutamos el logout y la navegación
    setTimeout(async () => {
      try {
        if (typeof logout === 'function') {
          await logout();
        }
      } finally {
        // Limpiamos los estados para que nunca persistan al volver a iniciar sesión
        setIsLoggingOut(false);
        setIsConfirming(false);
        setLogoutFeedback(null);
        navigate('/login');
      }
    }, 2000);
  };

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
        
        {/* Logotipo */}
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

        {/* Navegación según estado de sesión o feedback de salida */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {logoutFeedback ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs font-medium animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span>{logoutFeedback}</span>
            </div>
          ) : user ? (
            <>
              {/* Tarjeta de usuario */}
              <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 rounded-xl shadow-inner shrink-0">
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

              {/* Confirmación inline o botón de salida */}
              <div className="shrink-0 flex items-center">
                {isConfirming ? (
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-900/60 px-2.5 py-1 rounded-xl animate-in fade-in zoom-in-95">
                    <span className="text-[11px] text-amber-300 font-medium mr-0.5 select-none hidden xs:inline">
                      ¿Salir?
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={isLoggingOut}
                      icon={Check}
                      onClick={handleLogout}
                      title="Confirmar cierre de sesión"
                      className="!p-1 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isLoggingOut}
                      icon={X}
                      onClick={() => setIsConfirming(false)}
                      title="Cancelar"
                      className="!p-1 text-xs"
                    />
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={LogOut}
                    onClick={() => setIsConfirming(true)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                    title="Cerrar sesión"
                  />
                )}
              </div>
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