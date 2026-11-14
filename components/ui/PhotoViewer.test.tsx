import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
jest.mock('@capacitor/haptics', () => ({ Haptics: { impact: jest.fn() }, ImpactStyle: { Light: 'LIGHT' } }));
jest.mock('./OptimizedImage', () => ({ OptimizedImage: ({ alt }: { alt?: string }) => <img alt={alt ?? ''} /> }));

import { PhotoViewer } from './PhotoViewer';
import { Modal } from './Modal';
import { __resetDialogStack } from '../../hooks/useDialogA11y';
import { __resetBackHandlers } from '../../utils/backButton';

beforeEach(() => { __resetDialogStack(); __resetBackHandlers(); });

describe('PhotoViewer — teclado e foco', () => {
    it('é um diálogo com nome e recebe o foco', () => {
        render(<PhotoViewer src="a.jpg" alt="Foto da visita" onClose={jest.fn()} />);
        const dialog = screen.getByRole('dialog', { name: 'Foto da visita' });
        expect(dialog).toHaveFocus();
    });

    it('Esc fecha o visualizador', () => {
        const onClose = jest.fn();
        render(<PhotoViewer src="a.jpg" onClose={onClose} />);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('aberto sobre um Modal, o Esc fecha SÓ o visualizador e o Modal continua', () => {
        const closeModal = jest.fn();
        const closeViewer = jest.fn();
        render(<><Modal isOpen onClose={closeModal} title="Detalhes" /><PhotoViewer src="a.jpg" onClose={closeViewer} /></>);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(closeViewer).toHaveBeenCalledTimes(1);
        expect(closeModal).not.toHaveBeenCalled();
    });

    it('as setas continuam trocando de foto', () => {
        render(<PhotoViewer images={['a.jpg', 'b.jpg', 'c.jpg']} initialIndex={0} onClose={jest.fn()} />);
        fireEvent.keyDown(window, { key: 'ArrowRight' });
        expect(screen.getByText(/2\s*(\/|de)\s*3/)).toBeInTheDocument();
    });
});
