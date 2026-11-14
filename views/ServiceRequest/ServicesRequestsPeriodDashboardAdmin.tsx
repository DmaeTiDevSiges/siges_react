import React from 'react';
import { ServicesRequestsDashboardAdmin, ServicesRequestsDashboardAdminProps } from './ServicesRequestsDashboardAdmin';

/**
 * Página "Período" do dashboard de SS: a mesma tela da Online com `mode="period"`
 * (etapa 4 do PLANO_MELHORIAS_FRONTEND.md — antes era uma cópia de ~2.100 linhas).
 */
export const ServicesRequestsPeriodDashboardAdmin: React.FC<Omit<ServicesRequestsDashboardAdminProps, 'mode'>> = props => (
    <ServicesRequestsDashboardAdmin {...props} mode="period" />
);
