/**
 * Detects the device manufacturer and provides per-vendor guidance for the
 * "Auto-start" / "Background activity" settings that aggressive battery
 * savers (Xiaomi/MIUI, Huawei/EMUI, Oppo/ColorOS, Vivo, OnePlus/OxygenOS)
 * use to kill background services — even when all Android permissions are
 * granted.
 *
 * The "Auto-start" toggle is what tells the OEM's battery manager to leave
 * our foreground service alone after the screen is off.
 */

export type DeviceManufacturer =
    | 'xiaomi'
    | 'huawei'
    | 'oppo'
    | 'vivo'
    | 'samsung'
    | 'oneplus'
    | 'realme'
    | 'asus'
    | 'lenovo'
    | 'meizu'
    | 'nokia'
    | 'other';

export interface ManufacturerGuide {
    manufacturer: DeviceManufacturer;
    /** Friendly name shown in the UI. */
    label: string;
    /** Where to find the auto-start / background activity toggle. */
    path: string;
    /** Step-by-step instructions in Portuguese. */
    steps: string[];
    /** True if this OEM is known to aggressively kill background services. */
    isAggressive: boolean;
}

const GUIDES: Record<DeviceManufacturer, ManufacturerGuide> = {
    xiaomi: {
        manufacturer: 'xiaomi',
        label: 'Xiaomi / MIUI',
        isAggressive: true,
        path: 'Segurança > Autoinício',
        steps: [
            'Abra o app "Segurança" do Xiaomi',
            'Toque em "Autoinício"',
            'Encontre "Siges" na lista e ative o interruptor',
            'Volte em "Bateria" > "Economia de bateria do app" e selecione "Sem restrições"'
        ]
    },
    huawei: {
        manufacturer: 'huawei',
        label: 'Huawei / EMUI',
        isAggressive: true,
        path: 'Configurações > Bateria > Início automático',
        steps: [
            'Vá em "Configurações" > "Bateria"',
            'Toque em "Início automático"',
            'Desative "Gerenciar automaticamente" e ative o interruptor do "Siges"'
        ]
    },
    oppo: {
        manufacturer: 'oppo',
        label: 'Oppo / ColorOS',
        isAggressive: true,
        path: 'Configurações > Bateria > Inicialização em segundo plano',
        steps: [
            'Vá em "Configurações" > "Bateria"',
            'Toque em "Inicialização em segundo plano"',
            'Encontre "Siges" e ative "Permitir inicialização em segundo plano"'
        ]
    },
    vivo: {
        manufacturer: 'vivo',
        label: 'Vivo / FunTouchOS',
        isAggressive: true,
        path: 'Configurações > Bateria > Alto consumo de energia em segundo plano',
        steps: [
            'Vá em "Configurações" > "Bateria"',
            'Toque em "Alto consumo de energia em segundo plano"',
            'Encontre "Siges" e ative "Permitir atividade em segundo plano"'
        ]
    },
    samsung: {
        manufacturer: 'samsung',
        label: 'Samsung / OneUI',
        isAggressive: false,
        path: 'Configurações > Bateria > Limites de uso em segundo plano',
        steps: [
            'Vá em "Configurações" > "Bateria"',
            'Toque em "Limites de uso em segundo plano"',
            'Adicione "Siges" à lista de "Apps que nunca suspendem"'
        ]
    },
    oneplus: {
        manufacturer: 'oneplus',
        label: 'OnePlus / OxygenOS',
        isAggressive: true,
        path: 'Configurações > Bateria > Otimização de bateria',
        steps: [
            'Vá em "Configurações" > "Bateria"',
            'Toque em "Otimização de bateria"',
            'Mude para "Todos os apps", encontre "Siges" e selecione "Não otimizar"'
        ]
    },
    realme: {
        manufacturer: 'realme',
        label: 'Realme / RealmeUI',
        isAggressive: true,
        path: 'Configurações > Bateria > Otimização do uso da bateria',
        steps: [
            'Vá em "Configurações" > "Bateria" > "Otimização do uso da bateria"',
            'Encontre "Siges" e desative a otimização'
        ]
    },
    asus: {
        manufacturer: 'asus',
        label: 'Asus / ZenUI',
        isAggressive: false,
        path: 'Configurações > Bateria > Gerenciador de inicialização automático',
        steps: [
            'Vá em "Configurações" > "Bateria"',
            'Toque em "Gerenciador de inicialização automático"',
            'Permita que "Siges" inicie automaticamente'
        ]
    },
    lenovo: {
        manufacturer: 'lenovo',
        label: 'Lenovo',
        isAggressive: false,
        path: 'Configurações > Aplicativos > Siges > Inicialização automática',
        steps: ['Ative "Inicialização automática" para o Siges']
    },
    meizu: {
        manufacturer: 'meizu',
        label: 'Meizu / Flyme',
        isAggressive: true,
        path: 'Configurações > Bateria > Gerenciamento em segundo plano',
        steps: [
            'Vá em "Configurações" > "Bateria"',
            'Toque em "Gerenciamento em segundo plano"',
            'Mantenha pressionado "Siges" e selecione "Permitir em segundo plano"'
        ]
    },
    nokia: {
        manufacturer: 'nokia',
        label: 'Nokia',
        isAggressive: false,
        path: 'Configurações > Aplicativos > Siges > Bateria',
        steps: ['Selecione "Sem restrições" para o Siges']
    },
    other: {
        manufacturer: 'other',
        label: 'Outro fabricante',
        isAggressive: false,
        path: 'Configurações do Android',
        steps: [
            'Vá em "Configurações" > "Apps" > "Siges"',
            'Toque em "Bateria" e selecione "Sem restrições"',
            'Desative qualquer economia de energia que se aplique ao Siges'
        ]
    }
};

const MANUFACTURER_MAP: Record<string, DeviceManufacturer> = {
    xiaomi: 'xiaomi',
    redmi: 'xiaomi',
    poco: 'xiaomi',
    huawei: 'huawei',
    honor: 'huawei',
    oppo: 'oppo',
    realme: 'realme',
    vivo: 'vivo',
    samsung: 'samsung',
    oneplus: 'oneplus',
    asus: 'asus',
    lenovo: 'lenovo',
    motorola: 'lenovo',
    meizu: 'meizu',
    nokia: 'nokia',
    hmd: 'nokia'
};

export function detectManufacturer(): DeviceManufacturer {
    if (typeof navigator === 'undefined') return 'other';

    const uaData = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData;
    const candidates: string[] = [];

    if (uaData?.brands) {
        uaData.brands.forEach(b => candidates.push(b.brand));
    }
    if (typeof navigator.userAgent === 'string') {
        candidates.push(navigator.userAgent);
    }
    if (typeof navigator.platform === 'string') {
        candidates.push(navigator.platform);
    }

    const haystack = candidates.join(' ').toLowerCase();
    for (const key of Object.keys(MANUFACTURER_MAP)) {
        if (haystack.includes(key)) {
            return MANUFACTURER_MAP[key];
        }
    }
    return 'other';
}

export function getManufacturerGuide(manufacturer?: DeviceManufacturer): ManufacturerGuide {
    const key = manufacturer ?? detectManufacturer();
    return GUIDES[key];
}
