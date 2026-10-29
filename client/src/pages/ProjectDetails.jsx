import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjectDetails } from '../hooks/useProjectDetails';

import ProjectHeader from '../components/project/ProjectHeader';
import SettlementList from '../components/project/SettlementList';
import ExpenseForm from '../components/project/expenses';
import ExpenseList from '../components/project/expenses';
import MemberList from '../components/project/members';

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const {
    project,
    expenses,
    settlementHistory,
    balances,
    loading,
    metrics,
    isMe,
    getMyShareForExpense,
    addExpense,
    updateExpense,
    deleteExpense,
    addMember,
    removeMember,
    handleSettle,
    handleRevertSettle,
  } = useProjectDetails(id, user);

  if (loading && !project) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-400">
        <p>No se encontró el proyecto o no tienes acceso.</p>
        <Link to="/" className="text-indigo-400 hover:underline mt-4 inline-block">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Mis Proyectos
      </Link>

      <ProjectHeader project={project} metrics={metrics} currentUser={user} />

      <SettlementList
        project={project}
        balances={balances}
        expenses={expenses}
        currency={project?.currency || 'EUR'}
        currentUser={user}
        settlementHistory={settlementHistory}
        onSettle={handleSettle}
        onRevertSettle={handleRevertSettle}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ExpenseForm project={project} currentUser={user} onSubmit={addExpense} />
          <ExpenseList
            expenses={expenses}
            project={project}
            currentUser={user}
            isMe={isMe}
            getMyShareForExpense={getMyShareForExpense}
            onUpdateExpense={updateExpense}
            onDeleteExpense={deleteExpense}
          />
        </div>

        <div className="space-y-6">
          <MemberList
            project={project}
            currentUser={user}
            onAddMember={addMember}
            onRemoveMember={removeMember}
          />
        </div>
      </div>
    </div>
  );
}