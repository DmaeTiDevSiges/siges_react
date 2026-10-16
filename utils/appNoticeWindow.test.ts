import { isNoticeExpired, isNoticeWithinVigencia, isNoticeWithinViewWindow } from './appNoticeWindow';

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
