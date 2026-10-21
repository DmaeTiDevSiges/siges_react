import {
    getBloqueioLancamento,
    getNoticeWindowStatus,
    isNoticeExpired,
    isNoticeWithinVigencia,
    isNoticeWithinViewWindow,
} from './appNoticeWindow';

const notice = {
    isActive: true,
    viewStartDate: '2026-10-16T09:00:00',
    viewEndDate: '2026-10-16T09:30:00',
};

const at = (iso: string) => new Date(iso);

describe('isNoticeWithinViewWindow', () => {
    it('keeps the notice visible inside the window', () => {
        expect(isNoticeWithinViewWindow(notice, at('2026-10-16T09:15:00-03:00'))).toBe(true);
    });

    it('hides the notice when the window ends on the same day', () => {
        expect(isNoticeWithinViewWindow(notice, at('2026-10-16T09:30:01-03:00'))).toBe(false);
        expect(isNoticeWithinViewWindow(notice, at('2026-10-16T23:59:59-03:00'))).toBe(false);
    });

    it('hides the notice before the window starts', () => {
        expect(isNoticeWithinViewWindow(notice, at('2026-10-16T08:59:59-03:00'))).toBe(false);
    });

    it('hides inactive notices even inside the window', () => {
        expect(isNoticeWithinViewWindow({ ...notice, isActive: false }, at('2026-10-16T09:15:00-03:00'))).toBe(false);
    });

    it('interprets timestamps with an explicit offset as instants', () => {
        const offsetNotice = { ...notice, viewStartDate: '2026-10-16T12:00:00Z', viewEndDate: '2026-10-16T12:30:00Z' };
        expect(isNoticeWithinViewWindow(offsetNotice, at('2026-10-16T09:15:00-03:00'))).toBe(true);
        expect(isNoticeWithinViewWindow(offsetNotice, at('2026-10-16T09:31:00-03:00'))).toBe(false);
    });

    it('hides notices with invalid dates', () => {
        expect(isNoticeWithinViewWindow({ ...notice, viewEndDate: 'invalid' }, at('2026-10-16T09:15:00-03:00'))).toBe(false);
    });
});

describe('isNoticeWithinVigencia', () => {
    const vigencia = {
        startDate: '2026-10-16T09:00:00',
        endDate: '2026-10-16T09:30:00',
    };

    it('keeps the notice inside the vigência', () => {
        expect(isNoticeWithinVigencia(vigencia, at('2026-10-16T09:15:00-03:00'))).toBe(true);
    });

    it('drops the notice after the vigência ends on the same day', () => {
        expect(isNoticeWithinVigencia(vigencia, at('2026-10-16T09:30:01-03:00'))).toBe(false);
        expect(isNoticeWithinVigencia(vigencia, at('2026-10-16T23:59:59-03:00'))).toBe(false);
    });

    it('drops the notice before the vigência starts', () => {
        expect(isNoticeWithinVigencia(vigencia, at('2026-10-16T08:59:59-03:00'))).toBe(false);
    });

    it('does not depend on the device timezone', () => {
        // Mesmo instante, escrito em outro fuso: o resultado não pode mudar.
        expect(isNoticeWithinVigencia(vigencia, at('2026-10-16T12:15:00Z'))).toBe(true);
        expect(isNoticeWithinVigencia(vigencia, at('2026-10-16T12:31:00Z'))).toBe(false);
    });

    it('drops notices with invalid dates', () => {
        expect(isNoticeWithinVigencia({ ...vigencia, endDate: 'invalid' }, at('2026-10-16T09:15:00-03:00'))).toBe(false);
    });
});

describe('isNoticeExpired', () => {
    const vigencia = {
        startDate: '2026-10-16T09:00:00',
        endDate: '2026-10-16T09:30:00',
    };

    it('marks the notice as expired only after the vigência ends', () => {
        expect(isNoticeExpired(vigencia, at('2026-10-16T09:29:59-03:00'))).toBe(false);
        expect(isNoticeExpired(vigencia, at('2026-10-16T09:30:01-03:00'))).toBe(true);
    });

    it('does not mark notices with invalid dates as expired', () => {
        expect(isNoticeExpired({ ...vigencia, endDate: 'invalid' }, at('2026-10-16T09:31:00-03:00'))).toBe(false);
    });
});

describe('getNoticeWindowStatus', () => {
    const janela = {
        viewStartDate: '2026-10-16T09:00:00',
        viewEndDate: '2026-10-16T09:30:00',
    };

    it('reports "active" inside the janela (único estado lançável)', () => {
        expect(getNoticeWindowStatus(janela, at('2026-10-16T09:15:00-03:00'))).toBe('active');
        // Bordas: o instante exato de início/fim ainda está dentro da janela.
        expect(getNoticeWindowStatus(janela, at('2026-10-16T09:00:00-03:00'))).toBe('active');
        expect(getNoticeWindowStatus(janela, at('2026-10-16T09:30:00-03:00'))).toBe('active');
    });

    it('reports "ended" after the janela encerra', () => {
        expect(getNoticeWindowStatus(janela, at('2026-10-16T09:30:01-03:00'))).toBe('ended');
        expect(getNoticeWindowStatus(janela, at('2026-10-17T09:30:00-03:00'))).toBe('ended');
    });

    it('reports "future" antes da janela começar', () => {
        expect(getNoticeWindowStatus(janela, at('2026-10-16T08:59:59-03:00'))).toBe('future');
        expect(getNoticeWindowStatus(janela, at('2026-10-15T09:00:00-03:00'))).toBe('future');
    });

    it('does not depend on the device timezone', () => {
        expect(getNoticeWindowStatus(janela, at('2026-10-16T12:15:00Z'))).toBe('active');
        expect(getNoticeWindowStatus(janela, at('2026-10-16T12:30:01Z'))).toBe('ended');
        expect(getNoticeWindowStatus(janela, at('2026-10-16T11:59:59Z'))).toBe('future');
    });

    it('treats notices with invalid dates as ended', () => {
        expect(getNoticeWindowStatus({ ...janela, viewEndDate: 'invalid' }, at('2026-10-16T09:15:00-03:00'))).toBe('ended');
    });
});

describe('getBloqueioLancamento', () => {
    const livre = { canEdit: true, hasNotice: true, isShiftOpen: true, janelaStatus: 'active' as const };

    it('libera o lançamento com permissao, aviso, escala aberta e janela ativa', () => {
        expect(getBloqueioLancamento(livre)).toBeNull();
    });

    it('bloqueia sem permissao de edicao', () => {
        expect(getBloqueioLancamento({ ...livre, canEdit: false })).toBe('sem_permissao_edicao');
    });

    it('bloqueia sem aviso selecionado', () => {
        expect(getBloqueioLancamento({ ...livre, hasNotice: false })).toBe('sem_aviso');
    });

    it('prioriza a janela futura/encerrada sobre a escala encerrada', () => {
        // Fora da janela o motivo correto é a janela, não a escala escolhida.
        expect(getBloqueioLancamento({ ...livre, isShiftOpen: false, janelaStatus: 'future' })).toBe('janela_futura');
        expect(getBloqueioLancamento({ ...livre, isShiftOpen: false, janelaStatus: 'ended' })).toBe('janela_encerrada');
    });

    it('bloqueia escala encerrada com janela ativa', () => {
        expect(getBloqueioLancamento({ ...livre, isShiftOpen: false })).toBe('escala_encerrada');
    });

    it('classifica o caso generico como indisponivel', () => {
        expect(getBloqueioLancamento({ ...livre, janelaStatus: null })).toBe('indisponivel');
    });
});
