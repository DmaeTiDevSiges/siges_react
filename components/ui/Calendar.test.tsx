import React from 'react';
import { render, screen } from '@testing-library/react';
import { Calendar } from './Calendar';

const day = (n: number) => screen.getByRole('button', { name: String(n) });

describe('Calendar — período', () => {
    it('a faixa do período não vaza da célula (sem largura/margem negativa)', () => {
        render(<Calendar value="2026-11-10" onChange={() => undefined} rangeStart="2026-11-08" rangeEnd="2026-11-14" />);
        for (const n of [8, 9, 10, 11, 12, 13, 14]) {
            const cell = day(n).parentElement as HTMLElement;
            expect(cell.className).not.toMatch(/w-\[110%\]|-ml-\[/);
            expect(day(n).className).not.toMatch(/w-\[110%\]|-ml-\[/);
        }
    });

    it('dias entre o início e o fim ficam com a faixa; fora do período, não', () => {
        render(<Calendar value="2026-11-10" onChange={() => undefined} rangeStart="2026-11-08" rangeEnd="2026-11-14" />);
        expect((day(11).parentElement as HTMLElement).className).toMatch(/bg-primary\/10/);
        expect((day(20).parentElement as HTMLElement).className).not.toMatch(/bg-primary\/10/);
    });

    it('um dia só (início = fim) não desenha faixa', () => {
        render(<Calendar value="2026-11-21" onChange={() => undefined} rangeStart="2026-11-21" rangeEnd="2026-11-21" />);
        expect((day(21).parentElement as HTMLElement).className).not.toMatch(/bg-primary\/10/);
    });

    it('a faixa fecha nas pontas da semana e do mês (arredonda a 1ª e a última coluna)', () => {
        // 1/11/2026 é domingo: dia 1 = coluna 0, dia 7 = sábado (coluna 6)
        render(<Calendar value="2026-11-01" onChange={() => undefined} rangeStart="2026-11-01" rangeEnd="2026-11-30" />);
        expect((day(1).parentElement as HTMLElement).className).toMatch(/rounded-l-lg/);
        expect((day(7).parentElement as HTMLElement).className).toMatch(/rounded-r-lg/);
        expect((day(8).parentElement as HTMLElement).className).toMatch(/rounded-l-lg/);
        expect((day(11).parentElement as HTMLElement).className).not.toMatch(/rounded-[lr]-lg/);
    });

    it('marca início e fim do período em destaque e chama onChange ao clicar', () => {
        const onChange = jest.fn();
        render(<Calendar value="2026-11-08" onChange={onChange} rangeStart="2026-11-08" rangeEnd="2026-11-14" />);
        expect(day(8).className).toMatch(/bg-primary /);
        expect(day(14).className).toMatch(/bg-primary /);
        day(12).click();
        expect(onChange).toHaveBeenCalledWith('2026-11-12');
    });
});
