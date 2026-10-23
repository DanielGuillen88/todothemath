import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FolderPlus, AlertCircle, ArrowLeft } from 'lucide-react';
import ProjectFormFields from '../components/project/ProjectFormFields';

export default function CreateProject() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'trip',
    budget: '',
    currency: 'EUR',
    settlementMode: 'direct',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
      };

      const res = await api.post('/projects', payload);
      const created = res.data.data?.project || res.data.data || res.data.project || res.data;
      navigate(`/projects/${created._id || ''}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el proyecto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Nuevo Proyecto</h1>
            <p className="text-slate-400 text-sm">Configura un nuevo grupo para repartir gastos</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg flex items-center gap-2.5 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <ProjectFormFields
            values={form}
            onChange={handleFieldChange}
            disabled={isSubmitting}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}