import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, FolderKanban, Calendar, Euro } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        
        // Acceso a la ruta exacta del backend: res.data.data.projects
        const projectList = 
          res.data?.data?.projects || 
          res.data?.projects || 
          res.data?.data || 
          [];

        setProjects(Array.isArray(projectList) ? projectList : []);
      } catch (err) {
        console.error('Error cargando proyectos:', err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Mis Proyectos</h1>
          <p className="text-slate-400 text-sm mt-1">Gestiona los balances de tus grupos y eventos</p>
        </div>

        {/* <Link
          to="/projects/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Proyecto</span>
        </Link> */}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="inline-flex p-3 bg-indigo-600/10 text-indigo-400 rounded-xl mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">No tienes proyectos creados</h3>
          <p className="text-slate-400 text-sm mt-2 mb-6">
            Comienza creando un viaje o grupo para repartir gastos equitativamente.
          </p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primer proyecto</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <Link
              key={project._id || project.id || idx}
              to={`/projects/${project._id || project.id}`}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-xl transition-all hover:shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-900/50">
                    {project.type || 'General'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {project.title}
                </h3>
                <p className="text-slate-400 text-sm mt-1.5 line-clamp-2">
                  {project.description || 'Sin descripción adicional'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Euro className="w-4 h-4 text-emerald-400" />
                  Presupuesto:
                </span>
                <span className="font-semibold text-white">
                  {project.budget ? `${project.budget} €` : 'No asignado'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}