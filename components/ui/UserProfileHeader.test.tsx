import React from 'react';
import { render } from '@testing-library/react';

jest.mock('../../services/dataService', () => ({ dataService: { getCompanyById: jest.fn().mockResolvedValue(null) } }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('./UserAvatar', () => ({ UserAvatar: () => null }));
jest.mock('./CompanyAvatar', () => ({ CompanyAvatar: () => null }));

import { UserProfileHeader } from './UserProfileHeader';

describe('UserProfileHeader', () => {
    it('não renderiza sem usuário e renderiza ao receber o usuário (login)', () => {
        const { container, rerender } = render(<UserProfileHeader currentUser={null} />);
        expect(container).toBeEmptyDOMElement();
        expect(() => rerender(<UserProfileHeader currentUser={{ id: '1', nameFull: 'Maria Souza', isAvailable: true }} />)).not.toThrow();
        expect(container).not.toBeEmptyDOMElement();
    });

    it('volta a não renderizar ao perder o usuário (logout)', () => {
        const { container, rerender } = render(<UserProfileHeader currentUser={{ id: '1', nameFull: 'Maria Souza' }} />);
        expect(() => rerender(<UserProfileHeader currentUser={null} />)).not.toThrow();
        expect(container).toBeEmptyDOMElement();
    });
});
