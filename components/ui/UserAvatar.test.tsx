import React from 'react';
import { render } from '@testing-library/react';
import { UserAvatar } from './UserAvatar';

/** O `Avatar` é o filho direto do invólucro: é nele que a borda aparece. */
const avatar = (visitOpen?: boolean) =>
    render(<UserAvatar name="Ana Lima" status="available" visitOpen={visitOpen} />)
        .container.firstElementChild!.firstElementChild as HTMLElement;

describe('UserAvatar em uma visita', () => {
    it('visita aberta: borda vermelha', () => {
        expect(avatar(true).style.border).toBe('4px solid rgb(239, 68, 68)');
    });

    it('visita não aberta: sem borda', () => {
        const el = avatar(false);
        expect(el.getAttribute('style')).not.toContain('solid');
        expect(el.className).not.toMatch(/\bborder/);
    });

    it('fora de visita mantém a borda de disponibilidade', () => {
        expect(avatar().style.border).toBe('4px solid rgb(34, 197, 94)');
    });
});
