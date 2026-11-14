import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { ProfileRankingTab } from './ProfileRankingTab';
import { ProfileToolsTab } from './ProfileToolsTab';
import { ProfileSignatureTab } from './ProfileSignatureTab';

const score = (over: Record<string, unknown> = {}) => ({
    id: 's1', leaderId: '1', departmentName: 'Manutenção', scoreYear: 2026, scoreMonth: 10, totalVisits: 12, totalEvaluations: 10,
    failedEvaluations: 2, totalPenaltyScore: 0, avgComplianceScore: 95, rankingPosition: 3, ...over,
}) as never;
const badge = (over: Record<string, unknown> = {}) => ({ id: 'b1', leaderId: '1', badgeCode: 'TOP_1', badgeName: 'Líder do mês', scoreYear: 2026, scoreMonth: 9, ...over }) as never;

describe('ProfileRankingTab', () => {
    it('carregando mostra o aviso', () => {
        render(<ProfileRankingTab isTeamLeader loading history={[]} badges={[]} />);
        expect(screen.getByText('Carregando ranking...')).toBeInTheDocument();
    });

    it('quem não é líder vê "Somente líderes"', () => {
        render(<ProfileRankingTab isTeamLeader={false} loading={false} history={[score()]} badges={[]} />);
        expect(screen.getByText('Somente líderes')).toBeInTheDocument();
        expect(screen.queryByText('Manutenção')).not.toBeInTheDocument();
    });

    it('líder sem histórico vê o estado vazio', () => {
        render(<ProfileRankingTab isTeamLeader loading={false} history={[]} badges={[]} />);
        expect(screen.getByText('Sem dados de ranking')).toBeInTheDocument();
    });

    it('líder com histórico vê posição atual, mês e conformidade com a cor da faixa', () => {
        render(<ProfileRankingTab isTeamLeader loading={false} history={[score(), score({ id: 's2', scoreMonth: 9, avgComplianceScore: 60 })]} badges={[badge()]} />);
        expect(screen.getAllByText('Manutenção').length).toBeGreaterThan(0);
        expect(screen.getByText('Líder do mês')).toBeInTheDocument();
        // O mês mais recente aparece também no cartão da posição atual: pega o selo do histórico (span).
        const good = screen.getAllByText('95%').find(el => el.tagName === 'SPAN')!;
        const bad = screen.getAllByText('60%').find(el => el.tagName === 'SPAN')!;
        expect(good.className).toContain('green');
        expect(bad.className).toContain('red');
        expect(screen.queryByText('Sem dados de ranking')).not.toBeInTheDocument();
    });
});

describe('ProfileToolsTab', () => {
    it('carregando não mostra a lista nem o vazio', () => {
        render(<ProfileToolsTab loading tools={[]} />);
        expect(screen.queryByText('Nenhuma ferramenta')).not.toBeInTheDocument();
    });

    it('sem ferramentas mostra o estado vazio', () => {
        render(<ProfileToolsTab loading={false} tools={[]} />);
        expect(screen.getByText('Nenhuma ferramenta')).toBeInTheDocument();
    });

    it('lista código, descrição do material e data de início', () => {
        render(<ProfileToolsTab loading={false} tools={[{ id: 1, tool_code: 'FER-01', tool_brand: 'Bosch', tool_model: 'GSB', tool_serial: 'X1', tool_material_code: 'M1', tool_material_description: 'Furadeira', date_start: '2026-11-03' } as never]} />);
        expect(screen.getByText('FER-01')).toBeInTheDocument();
        expect(screen.getByText(/Furadeira/)).toBeInTheDocument();
        expect(screen.getByText('03/11/2026')).toBeInTheDocument();
    });

    it('ferramenta sem data de início mostra traço', () => {
        render(<ProfileToolsTab loading={false} tools={[{ id: 2, tool_code: 'FER-02' } as never]} />);
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
});

describe('ProfileSignatureTab', () => {
    const base = { isOwner: true, isAdmin: false, userUuid: 'u-1', signatureUrl: undefined as string | undefined, isSavingSignature: false, signatureUploadProgress: 0, onOpenPad: jest.fn(), onRequestDelete: jest.fn() };
    beforeEach(() => { base.onOpenPad.mockClear(); base.onRequestDelete.mockClear(); });

    it('sem assinatura: "Assinar Agora" abre o quadro e não há botão de excluir', () => {
        render(<ProfileSignatureTab {...base} />);
        fireEvent.click(screen.getByText('Assinar Agora'));
        expect(base.onOpenPad).toHaveBeenCalledTimes(1);
        expect(screen.queryByTitle('Excluir assinatura')).not.toBeInTheDocument();
        expect(screen.getByText('Aguardando')).toBeInTheDocument();
    });

    it('com assinatura: mostra a imagem, "Alterar Assinatura" e excluir pede confirmação', () => {
        render(<ProfileSignatureTab {...base} signatureUrl="http://x/s.png" />);
        expect(screen.getByAltText('Assinatura Padrão')).toHaveAttribute('src', 'http://x/s.png');
        fireEvent.click(screen.getByText('Alterar Assinatura'));
        expect(base.onOpenPad).toHaveBeenCalled();
        fireEvent.click(screen.getByTitle('Excluir assinatura'));
        expect(base.onRequestDelete).toHaveBeenCalledTimes(1);
    });

    it('sem uuid do usuário, excluir não faz nada', () => {
        render(<ProfileSignatureTab {...base} signatureUrl="http://x/s.png" userUuid={undefined} />);
        fireEvent.click(screen.getByTitle('Excluir assinatura'));
        expect(base.onRequestDelete).not.toHaveBeenCalled();
    });

    it('salvando: botões desabilitados e barra com o progresso', () => {
        const { container } = render(<ProfileSignatureTab {...base} signatureUrl="http://x/s.png" isSavingSignature signatureUploadProgress={40} />);
        expect(screen.getByText('Alterar Assinatura')).toBeDisabled();
        expect(screen.getByText('Processando...')).toBeInTheDocument();
        expect((container.querySelector('[style*="width: 40%"]'))).not.toBeNull();
    });

    it('quem não é dono nem admin só vê o estado da assinatura, sem ações', () => {
        render(<ProfileSignatureTab {...base} isOwner={false} signatureUrl="http://x/s.png" />);
        expect(screen.getByText('Assinatura cadastrada')).toBeInTheDocument();
        expect(screen.queryByText('Alterar Assinatura')).not.toBeInTheDocument();
    });
});
