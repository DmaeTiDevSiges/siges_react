import React, { useState, useEffect } from 'react';
import { Company, Contract, Department, Team, User } from '../../../types';
import { dataService } from '../../../services/dataService';
import { ActionIcon } from '../../../components/ui/ActionIcon';
import { DepartmentsList } from '../../Departments/DepartmentsList';
import { UsersList } from '../../Users/UsersList';
import { ProfilesList } from '../../Users/ProfilesList';
import { ContractsList } from '../../Contracts/ContractsList';
import { TabsBar } from '../../../components/ui/TabsBar';

interface CompanyDetailsProps {
  company: Company;
  onEdit: () => void;
  onDelete?: () => void;
  onAddDepartment?: () => void;
  onSelectDepartment?: (department: Department) => void;
  onSelectTeam?: (team: Team) => void;
  onAddTeam?: (departmentId: string) => void;
  onDeleteTeam?: (teamId: string) => void;
  onAddUser?: () => void;
  onSelectUser?: (user: User) => void;
  onSelectContract?: (contract: Contract) => void;
  onAddContract?: () => void;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  company,
  onEdit,
  onDelete,
  onAddDepartment,
  onSelectDepartment,
  onSelectTeam,
  onAddTeam,
  onDeleteTeam,
  onAddUser,
  onSelectUser,
  onSelectContract,
  onAddContract
}) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem(`activeTab_${company.id}`) || 'Departamentos';
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(`activeTab_${company.id}`, tab);
  };
  const [showMenu, setShowMenu] = useState(false);

  // Sync tab when company changes
  useEffect(() => {
    const saved = localStorage.getItem(`activeTab_${company.id}`);
    if (saved) setActiveTab(saved);
    else setActiveTab('Departamentos');
  }, [company.id]);


  return (
    <div className="flex flex-col">
      <div className="relative flex p-4 flex-col gap-4 items-center pt-6">

        {/* Context Menu Button */}
        {(onEdit || onDelete) && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500/10 border-2 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-card-dark rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 z-20 py-1">
                  {onEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Excluir
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="relative mt-4">
          <div
            className="bg-center bg-no-repeat bg-cover rounded-full h-32 w-32 shadow-lg border-4 border-surface-light dark:border-surface-dark"
            style={{ backgroundImage: `url(${company.logoUrl})` }}
          />

        </div>
        <div className="flex flex-col items-center justify-center gap-1">
          <h1 className="text-slate-900 dark:text-white text-[22px] font-bold tracking-tight text-center">{company.name}</h1>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wide">
            {company.code || company.category}
          </span>

        </div>
      </div>



      <TabsBar
        tabs={['Departamentos', 'Usuários', 'Permissões', 'Contratos']}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeTab === 'Departamentos' && (
        <div className="flex flex-col pb-8">
          <DepartmentsList
            companyId={company.id}
            onAddDepartment={onAddDepartment}
            onSelect={onSelectDepartment}
            onSelectTeam={onSelectTeam}
            onAddTeam={onAddTeam}
            onDeleteTeam={onDeleteTeam}
          />
        </div>
      )}

      {activeTab === 'Usuários' && (
        <UsersList
          companyId={company.id}
          onAddUser={onAddUser}
          onSelectUser={onSelectUser}
        />
      )}

      {activeTab === 'Contratos' && (
        <div className="flex flex-col">
          <ContractsList
            companyId={company.id}
            onSelect={onSelectContract}
            onAdd={onAddContract}
          />
        </div>
      )}

      {activeTab === 'Permissões' && (
        <ProfilesList
          companyId={company.id}
        />
      )}
    </div>
  );
};
