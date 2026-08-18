import React from 'react';
import { isFinancialApprovalEnabled, VISIT_COSTS_STATUS_CONFIG, type VisitCostsStatus } from '../../features';

interface OrderVisitFinancialStatusProps {
  costsStatus: VisitCostsStatus | null | undefined;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  compact?: boolean;
}

export const OrderVisitFinancialStatus: React.FC<OrderVisitFinancialStatusProps> = ({
  costsStatus,
  submittedAt,
  approvedAt,
  rejectedAt,
  rejectionReason,
  compact = false
}) => {
  // Se feature não está habilitada, não renderiza nada
  if (!isFinancialApprovalEnabled()) {
    return null;
  }

  // Se não há status financeiro (visitante antigo ou não aprovada tecnicamente)
  if (!costsStatus) {
    return null;
  }

  const config = VISIT_COSTS_STATUS_CONFIG[costsStatus];

  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
        {config.label}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor}`}>
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
      
      {costsStatus === 'submitted' && submittedAt && (
        <span className="text-xs text-gray-500">
          em {new Date(submittedAt).toLocaleDateString('pt-BR')}
        </span>
      )}
      
      {costsStatus === 'approved' && approvedAt && (
        <span className="text-xs text-green-600">
          ✓ Aprovado em {new Date(approvedAt).toLocaleDateString('pt-BR')}
        </span>
      )}
      
      {costsStatus === 'rejected' && rejectedAt && (
        <div className="flex flex-col">
          <span className="text-xs text-red-600">
            ✗ Rejeitado em {new Date(rejectedAt).toLocaleDateString('pt-BR')}
          </span>
          {rejectionReason && (
            <span className="text-xs text-red-500 mt-0.5">
              Motivo: {rejectionReason}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderVisitFinancialStatus;
