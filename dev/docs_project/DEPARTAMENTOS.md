# Guia de Departamentos - Sistema Siges

## Visão Geral
O módulo de Departamentos permite organizar as empresas em setores/departamentos específicos, facilitando a gestão e categorização das estruturas organizacionais.

## Estrutura do Banco de Dados

### Tabela: `cfg_departments`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | bigint | Identificador único |
| company_id | bigint | ID da empresa (chave estrangeira) |
| code | string | Código do departamento (ex: "RH", "TI") |
| description | string | Nome completo do departamento |
| is_available | boolean | Status ativo/inativo |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de última atualização |

## Funcionalidades Implementadas

### 1. Criar Departamento
**Localização:** Detalhes da Empresa → Aba "Departamentos" → Botão "Adicionar Departamento"

**Campos obrigatórios:**
- Nome do Departamento (ex: "Recursos Humanos")
- Código (ex: "RH")
- Status (Ativo/Inativo)

**Exemplo de uso:**
```typescript
const department = {
  companyId: "1",
  name: "Recursos Humanos",
  code: "RH",
  status: "active"
};

await dataService.createDepartment(department);
```

### 2. Listar Departamentos
**Modo 1 - Por Empresa:**
```typescript
const departments = await dataService.getDepartmentsByCompany(companyId);
```

**Modo 2 - Todos os Departamentos:**
```typescript
const allDepartments = await dataService.getDepartments();
```

### 3. Atualizar Departamento
```typescript
await dataService.updateDepartment(departmentId, {
  name: "Novo Nome",
  code: "NN",
  status: "inactive"
});
```

### 4. Deletar Departamento
```typescript
await dataService.deleteDepartment(departmentId);
```

## Como Usar na Interface

### Passo 1: Executar o Schema SQL
Execute o arquivo `supabase/departments_schema.sql` no SQL Editor do Supabase para criar a tabela e as políticas RLS.

### Passo 2: Acessar Departamentos
1. Navegue até a lista de empresas
2. Selecione uma empresa
3. Clique na aba "Departamentos"
4. Clique em "Adicionar Departamento"

### Passo 3: Preencher o Formulário
- **Nome do Departamento:** Nome completo e descritivo
- **Código:** Sigla ou código curto (2-4 caracteres)
- **Status:** Selecione "Ativo" ou "Inativo"

### Passo 4: Salvar
Clique em "Salvar" para criar o departamento. Você será redirecionado automaticamente para a lista de departamentos da empresa.

## Componentes React

### DepartmentsList
Exibe a lista de departamentos com busca e filtros.

**Props:**
- `companyId?: string` - Filtra por empresa específica
- `onSelect?: (department) => void` - Callback ao selecionar um departamento

### DepartmentForm
Formulário para criar/editar departamentos.

**Props:**
- `companyId: string` - ID da empresa (obrigatório)
- `initialDepartment?: Partial<Department>` - Dados iniciais para edição
- `onSave: (department) => void` - Callback ao salvar
- `onCancel: () => void` - Callback ao cancelar

## Segurança (RLS)

As políticas de Row Level Security estão configuradas para:
- ✅ SELECT público (visualização)
- ✅ INSERT público (criação)
- ✅ UPDATE público (atualização)
- ✅ DELETE público (exclusão)

> **Nota:** Em produção, ajuste essas políticas para incluir autenticação de usuários.

## Tipos TypeScript

```typescript
interface Department {
  id: string;
  companyId: string;
  name: string;        // description no DB
  code: string;        // code no DB
  status: 'active' | 'inactive';  // is_available no DB
  companyName?: string;  // helper UI
}
```

## Exemplos de Códigos Comuns

| Departamento | Código Sugerido |
|-------------|----------------|
| Recursos Humanos | RH |
| Tecnologia da Informação | TI |
| Financeiro | FIN |
| Comercial | COM |
| Operações | OPS |
| Marketing | MKT |
| Jurídico | JUR |
| Compras | CPR |
| Qualidade | QLD |
| Manutenção | MNT |

## Troubleshooting

### Erro: "Bucket not found"
**Solução:** Este erro não afeta departamentos, pois eles não usam storage.

### Erro: "Foreign key constraint"
**Solução:** Certifique-se de que o `company_id` existe na tabela `cfg_companies`.

### Departamentos não aparecem
**Solução:** 
1. Verifique se a tabela foi criada corretamente
2. Execute as políticas RLS do arquivo `departments_schema.sql`
3. Confirme que a empresa possui departamentos cadastrados

## Próximas Funcionalidades (Roadmap)

- [ ] Edição de departamentos
- [ ] Hierarquia de departamentos (sub-departamentos)
- [ ] Associação de funcionários a departamentos
- [ ] Relatórios por departamento
- [ ] Permissões específicas por departamento

## Suporte

Para dúvidas ou problemas, consulte:
- Código-fonte: `/views/Departments/`
- Serviços: `/services/dataService.ts`
- Tipos: `/types.ts`
- Schema SQL: `/supabase/departments_schema.sql`
