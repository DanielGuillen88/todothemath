import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { createProject } from '../services/projectService.js';
import { Button } from '../components/ui';
import ProjectFormFields from '../components/project/ProjectFormFields';

export default function CreateProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    currency: 'EUR',
    type: 'trip',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('El nombre del proyecto es obligatorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: formData.budget !== '' ? Number(formData.budget) : 0,
        currency: formData.currency,
        type: formData.type || 'trip',
      };

      const res = await createProject(payload);
      const newProjectId = res.data?.data?.project?._id || res.data?.project?._id || res.data?._id;
      navigate(newProjectId ? `/projects/${newProjectId}` : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Mis Proyectos
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">Crear Nuevo Proyecto</h1>
        <p className="text-slate-400 text-xs mb-6">
          Define los datos iniciales para empezar a compartir gastos y saldar deudas directamente.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProjectFormFields
            values={formData}
            onChange={handleFieldChange}
            disabled={loading}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading}>
              Crear Proyecto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}