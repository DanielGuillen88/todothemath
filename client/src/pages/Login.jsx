import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input, Button } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      setSuccessMessage('¡Sesión iniciada con éxito! Redirigiendo...');
      setTimeout(() => {
        navigate('/');
      }, 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Comprueba tus credenciales.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Iniciar Sesión</h2>
          <p className="text-sm text-slate-400 mt-1">Accede a tus proyectos y balances de gastos</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg flex items-center gap-2.5 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg flex items-center gap-2.5 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="login-email"
            label="Correo Electrónico"
            type="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="!py-2.5 !text-sm"
          />

          <Input
            id="login-password"
            label="Contraseña"
            type="password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="!py-2.5 !text-sm"
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={LogIn}
            className="w-full mt-2 !py-2.5"
          >
            {isSubmitting ? (successMessage ? 'Accediendo...' : 'Iniciando sesión...') : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}