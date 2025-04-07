
import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { EstoqueDashboard } from './dashboards/EstoqueDashboard';
import { ComprasDashboard } from './dashboards/ComprasDashboard';
import { ProfessorDashboard } from './dashboards/ProfessorDashboard';
import { CoordenacaoDashboard } from './dashboards/CoordenacaoDashboard';

const RoleBasedLayout = () => {
  const { profile } = useAuthContext();

  if (!profile) {
    return <div>Carregando...</div>;
  }

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'estoque':
      return <EstoqueDashboard />;
    case 'compras':
      return <ComprasDashboard />;
    case 'professor':
      return <ProfessorDashboard />;
    case 'coordenacao':
      return <CoordenacaoDashboard />;
    default:
      return <div>Perfil não reconhecido</div>;
  }
};

export default RoleBasedLayout;
