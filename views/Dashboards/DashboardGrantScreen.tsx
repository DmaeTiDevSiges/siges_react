import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { formatDateInBrazil } from '../../utils/formatters';

import { User, OrderFilters } from '../../types';
import { dataService } from '../../services/dataService';
import { FilterBarResponsive, FilterBarResponsiveHandle } from '../../components/ui/FilterBarResponsive';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

type GrantStatus = 'completed' | 'running' | 'planned' | 'critical';
type ViewMode = 'monthly' | 'quarterly';

type CapsuleStyle = 'solid-green' | 'outline-green' | 'solid-cyan' | 'outline-cyan' | 'gradient-orange-red' | 'outline-red' | 'outline-amber';

interface PlottedOSBar {
  id: string;
  oId: string;
  orderMask: string;
  label: string;
  badge?: string;
  status: GrantStatus;
  statusId: number;
  wasAuthorized: boolean;
  authorizedAt: string | null;
  statusDescription: string;
  style: CapsuleStyle;
  startWeek: number; // 0 to 47 (12 months * 4 weeks)
  endWeek: number;   // 0 to 47
  startDateStr: string;
  endDateStr: string;
  visitsCount: number;
  progress: number;
  requestedServices?: string;
  orderDescription?: string;
}

interface UnitGroup {
  id: string;
  name: string;
  bars: PlottedOSBar[];
}

const MONTHS_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const QUARTERS = ['1º TRIMESTRE (JAN - MAR)', '2º TRIMESTRE (ABR - JUN)', '3º TRIMESTRE (JUL - SET)', '4º TRIMESTRE (OUT - DEZ)'];
const TOTAL_WEEKS = 48; // 12 months * 4 weeks

// Helper to convert date string into global week index [0..47]
const dateToWeekIndex = (dateStr: string, year: number): number => {
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  const parsedDate = isoDate ? null : new Date(dateStr);
  const dYear = isoDate ? Number(isoDate[1]) : parsedDate!.getFullYear();
  if (dYear < year) return 0;
  if (dYear > year) return TOTAL_WEEKS - 1;

  const month = isoDate ? Number(isoDate[2]) - 1 : parsedDate!.getMonth(); // 0..11
  const day = isoDate ? Number(isoDate[3]) : parsedDate!.getDate(); // 1..31

  let weekInMonth = 0;
  if (day <= 7) {
    weekInMonth = 0;
  } else if (day <= 14) {
    weekInMonth = 1;
  } else if (day <= 21) {
    weekInMonth = 2;
  } else {
    weekInMonth = 3;
  }

  return month * 4 + weekInMonth;
};

const formatGrantDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return formatDateInBrazil(date, 'dateTime', 'pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Component Props ─────────────────────────────────────────────────────────

interface GrantDashboardScreenProps {
  currentUser?: User | null;
  onNavigate?: (screen: string) => void;
  onFilterBarRef?: (ref: FilterBarResponsiveHandle | null) => void;
  onMobileFilterCountChange?: (count: number) => void;
}

export const GrantDashboardScreen: React.FC<GrantDashboardScreenProps> = ({
  currentUser,
  onNavigate: _onNavigate,
  onFilterBarRef,
  onMobileFilterCountChange,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const currentDay = new Date().getDate();
  const currentWeekInMonth = currentDay <= 7 ? 0 : currentDay <= 14 ? 1 : currentDay <= 21 ? 2 : 3;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [search, setSearch] = useState('');
  const [showAuthorizedOrders, setShowAuthorizedOrders] = useState(true);

  // ── Auto-adjustable and resizable UNIDADES column ──
  const [unitColWidth, setUnitColWidth] = useState<number | null>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const thRef = useRef<HTMLTableCellElement>(null);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = thRef.current ? thRef.current.offsetWidth : (unitColWidth || 160);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(90, Math.min(600, startWidthRef.current + delta));
      setUnitColWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleDoubleClickResize = () => {
    setUnitColWidth(null); // Resets to pure auto
  };

  const filterBarRef = useRef<FilterBarResponsiveHandle>(null);

  useEffect(() => {
    onFilterBarRef?.(filterBarRef.current);
    return () => onFilterBarRef?.(null);
  }, [onFilterBarRef]);

  // ── Filters State ──
  const [advancedOrdersFilters, setAdvancedOrdersFilters] = useState<OrderFilters>(() => {
    try {
      const saved = localStorage.getItem('grant_advancedOrdersFilters') || localStorage.getItem('advancedOrdersFilters');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(() => {
    try {
      const saved = localStorage.getItem('grant_appliedOrdersFilters') || localStorage.getItem('appliedOrdersFilters');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [filterOptions, setFilterOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('cachedFilterOptions');
      if (saved) {
        const cachedOptions = JSON.parse(saved);
        return { ...cachedOptions, maintenancePlans: cachedOptions.maintenancePlans || [] };
      }
    } catch {}
    return {
      systems: [] as any[],
      subSystems: [] as any[],
      unitTypes: [] as any[],
      units: [] as any[],
      sectors: [] as any[],
      purposes: [] as any[],
      orderTypes: [] as any[],
      orderObjects: [] as any[],
      contracts: [] as any[],
      plans: [] as any[],
      teams: [] as any[],
      causeReasons: [] as any[],
      maintenancePlans: [] as any[],
    };
  });

  const [unitSubTypes, setUnitSubTypes] = useState<any[]>([]);
  const [assetTagSubs, setAssetTagSubs] = useState<any[]>([]);
  const [orderSubTypes, setOrderSubTypes] = useState<any[]>([]);
  const [hoveredBar, setHoveredBar] = useState<{
    bar: PlottedOSBar;
    anchor: HTMLElement;
    left: number;
    top: number;
    placement: 'above' | 'below';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [_osFilterCount, setOsFilterCount] = useState(0);

  // Real Plotted Data from DB
  const [unitsData, setUnitsData] = useState<UnitGroup[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const updateBarTooltipPosition = useCallback((bar: PlottedOSBar, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    const placement = rect.top > 160 ? 'above' : 'below';
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 272));
    setHoveredBar({
      bar,
      anchor,
      left,
      top: placement === 'above' ? rect.top - 8 : rect.bottom + 8,
      placement,
    });
  }, []);

  useEffect(() => {
    if (!hoveredBar) return;

    const updatePosition = () => {
      if (!hoveredBar.anchor.isConnected) {
        setHoveredBar(null);
        return;
      }
      updateBarTooltipPosition(hoveredBar.bar, hoveredBar.anchor);
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [hoveredBar, updateBarTooltipPosition]);

  // ── Fetch Orders & Union of Visits ──
  const fetchGrantOrders = useCallback(async (filters: OrderFilters, year: number) => {
    // 1) Requirement 1: Single sector is mandatory
    const selectedSectors = Array.isArray(filters.assetTagId)
      ? filters.assetTagId.filter(Boolean)
      : (filters.assetTagId ? [filters.assetTagId] : []);

    if (selectedSectors.length === 0) {
      toast.error('O filtro de SETOR é obrigatório. Selecione um setor.');
      setUnitsData([]);
      setHasQueried(true);
      return;
    }

    const targetSectorId = String(selectedSectors[0]);

    setIsLoading(true);
    setHasQueried(true);

    try {
      const { maintenancePlanId, ...orderFilters } = filters;
      const startDate = `${year}-01-01 00:00:00`;
      const endDate = `${year}-12-31 23:59:59`;

      // 2) Requirement 2: Fetch all matching orders
      let allRows: any[] = [];
      let page = 0;
      const pageSize = 500;
      let hasMore = true;

      while (hasMore) {
        const result = await dataService.getOrdersVisitsView({
          startDate,
          endDate,
          page,
          pageSize,
          ...orderFilters,
          assetTagId: targetSectorId,
        });

        const data = result?.data || [];
        allRows = [...allRows, ...data];

        if (data.length < pageSize || allRows.length >= (result?.count || 0)) {
          hasMore = false;
        } else {
          page++;
          if (page >= 10) break;
        }
      }

      const selectedMaintenancePlanIds = Array.isArray(maintenancePlanId)
        ? maintenancePlanId.filter(Boolean)
        : maintenancePlanId ? [maintenancePlanId] : [];
      if (selectedMaintenancePlanIds.length > 0) {
        const matchingOrderIds = new Set(
          await dataService.getOrderIdsByMaintenancePlanIds(selectedMaintenancePlanIds)
        );
        allRows = allRows.filter(row => matchingOrderIds.has(String(row.o_id || row.id)));
      }

      const orderIds = [...new Set(allRows.map(row => row.o_id || row.id).filter(Boolean).map(String))];
      const authorizations = await dataService.getAuthorizedOrdersFromStatusLogs(orderIds);
      const authorizationByOrderId = new Map(
        authorizations.map(({ orderId, authorizedAt }) => [orderId, authorizedAt])
      );

      // Group rows by unique Order (o_id)
      const orderMap = new Map<string, {
        oId: string;
        orderMask: string;
        orderDescription: string;
        requestedServices: string;
        unitId: string;
        unitDescription: string;
        statusId: number;
        wasAuthorized: boolean;
        authorizedAt: string | null;
        statusDescription: string;
        progress: number;
        requestedAt: string | null;
        visits: {
          id: string;
          mask: string;
          startedAt: string | null;
          endedAt: string | null;
          statusId: number;
        }[];
      }>();

      for (const row of allRows) {
        const oId = String(row.o_id || row.id);
        if (!oId || oId === 'undefined') continue;

        if (!orderMap.has(oId)) {
          orderMap.set(oId, {
            oId,
            orderMask: row.o_mask || `OS-${oId}`,
            orderDescription: row.o_description || row.o_type_description || '',
            requestedServices: row.o_requested_services || '',
            unitId: String(row.o_unit_id || ''),
            unitDescription: row.o_unit_description || row.unit_description || 'Unidade Sem Nome',
            statusId: Number(row.ov_o_status_id || row.o_status_id || 0),
            wasAuthorized: authorizationByOrderId.has(oId),
            authorizedAt: authorizationByOrderId.get(oId) || null,
            statusDescription: row.ov_o_status_description || row.o_status_description || '',
            progress: row.ov_o_progress ? Math.round(parseFloat(row.ov_o_progress) * 100) : 0,
            requestedAt: row.o_requested_at || null,
            visits: [],
          });
        }

        const order = orderMap.get(oId)!;
        if (row.ov_id || row.ov_mask || row.ov_started_at) {
          order.visits.push({
            id: String(row.ov_id || row.id),
            mask: row.ov_mask || '',
            startedAt: row.ov_started_at || null,
            endedAt: row.ov_ended_at || null,
            statusId: Number(row.ov_status_id || 0),
          });
        }
      }

      // 3) Requirement 3: Plot OSs by week columns, using union of visits (1st visit start to 2nd visit end)
      const unitMap = new Map<string, UnitGroup>();

      for (const os of orderMap.values()) {
        const validVisits = os.visits
          .filter(v => v.startedAt || v.endedAt)
          .sort((a, b) => {
            const timeA = new Date(a.startedAt || a.endedAt || 0).getTime();
            const timeB = new Date(b.startedAt || b.endedAt || 0).getTime();
            return timeA - timeB;
          });

        let startDateStr = '';
        let endDateStr = '';

        if (validVisits.length >= 2) {
          // 1st visit start & 2nd visit end
          const firstVisit = validVisits[0];
          const secondVisit = validVisits[1] || validVisits[validVisits.length - 1];
          startDateStr = firstVisit.startedAt || firstVisit.endedAt || '';
          endDateStr = secondVisit.endedAt || secondVisit.startedAt || startDateStr;
        } else if (validVisits.length === 1) {
          const onlyVisit = validVisits[0];
          startDateStr = onlyVisit.startedAt || onlyVisit.endedAt || '';
          endDateStr = onlyVisit.endedAt || onlyVisit.startedAt || startDateStr;
        } else if (os.requestedAt) {
          startDateStr = os.requestedAt;
          endDateStr = os.requestedAt;
        }

        if (!startDateStr) continue;

        const startWeek = dateToWeekIndex(startDateStr, year);
        let endWeek = dateToWeekIndex(endDateStr || startDateStr, year);

        if (startWeek > endWeek) {
          endWeek = startWeek;
        }

        const span = endWeek - startWeek + 1;
        const stDesc = (os.statusDescription || '').toLowerCase();

        let status: GrantStatus = 'running';
        let style: CapsuleStyle = 'solid-cyan';
        let badge: string | undefined = os.progress > 0 ? `${os.progress}%` : undefined;

        const isSuspended = os.statusId === 6;
        const isCompleted = os.statusId === 8;

        if (isCompleted) {
          status = 'completed';
          badge = undefined;
          style = span >= 3 ? 'solid-green' : 'outline-green';
        } else if (isSuspended) {
          status = 'critical';
          style = span >= 3 ? 'gradient-orange-red' : 'outline-red';
          badge = 'Suspensa';
        } else if (stDesc.includes('atrasad') || stDesc.includes('crític') || stDesc.includes('critic')) {
          status = 'critical';
          style = span >= 3 ? 'gradient-orange-red' : 'outline-red';
          badge = badge ? `${badge} • Alerta` : 'Alerta';
        } else if (stDesc.includes('planej') || stDesc.includes('abert') || os.statusId === 1) {
          status = 'planned';
          style = 'outline-amber';
        } else {
          status = 'running';
          style = span >= 3 ? 'solid-cyan' : 'outline-cyan';
        }

        const bar: PlottedOSBar = {
          id: `bar-${os.oId}`,
          oId: os.oId,
          orderMask: os.orderMask,
          label: os.orderMask,
          badge,
          status,
          statusId: os.statusId,
          wasAuthorized: os.wasAuthorized,
          authorizedAt: os.authorizedAt,
          statusDescription: os.statusDescription,
          style,
          startWeek,
          endWeek,
          startDateStr,
          endDateStr,
          visitsCount: os.visits.length,
          progress: os.progress,
          requestedServices: os.requestedServices,
          orderDescription: os.orderDescription,
        };

        const unitKey = os.unitId || os.unitDescription;
        if (!unitMap.has(unitKey)) {
          unitMap.set(unitKey, {
            id: unitKey,
            name: os.unitDescription,
            bars: [],
          });
        }
        unitMap.get(unitKey)!.bars.push(bar);
      }

      const unitsList = Array.from(unitMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setUnitsData(unitsList);
    } catch (err) {
      console.error('Error fetching grant orders:', err);
      toast.error('Erro ao buscar ordens de serviço');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial filter options and preselect 1 sector if none
  const currentUserId = currentUser?.id;
  const currentUserDepartmentId = currentUser?.departmentId;

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const results = await Promise.allSettled([
          dataService.getSystemsParent(),
          dataService.getUnitTypesParent(),
          dataService.getOrdersObjects(),
          dataService.getOrderTypes(),
          dataService.getPlans(),
          currentUserId ? dataService.getManagedContracts(currentUserId.toString()) : dataService.getContracts(),
          dataService.getTeams(undefined, currentUserDepartmentId),
          dataService.getUnits('active'),
          dataService.getAssetTags('active'),
          dataService.getOrderCauseReasons(),
          dataService.getMaintenancePlans(),
        ]);

        const getVal = (res: any, name: string) => {
          if (res.status === 'rejected') {
            console.error(`Failed to load ${name}:`, res.reason);
            return [];
          }
          return res.value || [];
        };

        const contracts = getVal(results[5], 'contracts');
        const sectors = getVal(results[8], 'sectors');

        setFilterOptions((prev: any) => ({
          ...prev,
          systems: getVal(results[0], 'systems'),
          unitTypes: getVal(results[1], 'unitTypes'),
          orderObjects: getVal(results[2], 'orderObjects'),
          orderTypes: getVal(results[3], 'orderTypes'),
          plans: getVal(results[4], 'plans'),
          contracts,
          teams: getVal(results[6], 'teams'),
          units: getVal(results[7], 'units'),
          sectors,
          causeReasons: getVal(results[9], 'causeReasons'),
          maintenancePlans: getVal(results[10], 'maintenance plans'),
        }));

        const defaultContractIds = contracts.length > 0 ? contracts.map((c: any) => String(c.id)) : [];

        let initialSector: string[] = [];
        const savedSector = advancedOrdersFilters.assetTagId;
        if (Array.isArray(savedSector) && savedSector.length > 0) {
          initialSector = [String(savedSector[0])];
        } else if (sectors.length > 0) {
          initialSector = [String(sectors[0].id)];
        }

        const initialFilters: OrderFilters = {
          ...advancedOrdersFilters,
          contractId: (Array.isArray(advancedOrdersFilters.contractId) && advancedOrdersFilters.contractId.length > 0)
            ? advancedOrdersFilters.contractId
            : defaultContractIds,
          assetTagId: initialSector,
        };

        setAdvancedOrdersFilters(initialFilters);
        setAppliedFilters(initialFilters);

        if (initialSector.length > 0) {
          fetchGrantOrders(initialFilters, selectedYear);
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };

    loadOptions();
  }, [currentUserId, currentUserDepartmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist filters
  useEffect(() => {
    localStorage.setItem('grant_advancedOrdersFilters', JSON.stringify(advancedOrdersFilters));
  }, [advancedOrdersFilters]);

  useEffect(() => {
    localStorage.setItem('grant_appliedOrdersFilters', JSON.stringify(appliedFilters));
  }, [appliedFilters]);

  // Dynamic filter options recoveries
  useEffect(() => {
    const recoverOptions = async () => {
      if (advancedOrdersFilters.unitTypeParentId) {
        const ids = Array.isArray(advancedOrdersFilters.unitTypeParentId)
          ? advancedOrdersFilters.unitTypeParentId
          : [advancedOrdersFilters.unitTypeParentId];
        if (ids.length > 0) {
          const results = await Promise.all(ids.map(id => dataService.getUnitTypes(id)));
          setUnitSubTypes(results.flat());
        }
      }
      if (advancedOrdersFilters.systemParentId) {
        const ids = Array.isArray(advancedOrdersFilters.systemParentId)
          ? advancedOrdersFilters.systemParentId
          : [advancedOrdersFilters.systemParentId];
        if (ids.length > 0) {
          const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
          setFilterOptions((prev: any) => ({ ...prev, subSystems: results.flat() }));
        }
      }
      if (advancedOrdersFilters.orderTypeId) {
        const ids = Array.isArray(advancedOrdersFilters.orderTypeId)
          ? advancedOrdersFilters.orderTypeId
          : [advancedOrdersFilters.orderTypeId];
        if (ids.length > 0) {
          const results = await Promise.all(ids.map(id => dataService.getOrderSubTypesByType(id)));
          setOrderSubTypes(results.flat());
        }
      }
      if (advancedOrdersFilters.assetTagId) {
        const ids = Array.isArray(advancedOrdersFilters.assetTagId)
          ? advancedOrdersFilters.assetTagId
          : [advancedOrdersFilters.assetTagId];
        if (ids.length > 0) {
          const results = await Promise.all(ids.map(tagId => dataService.getAssetTagSubs(tagId, 'active')));
          setAssetTagSubs(results.flat());
        }
      }
    };
    recoverOptions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSystemChange = async (systemId: string | string[]) => {
    setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, systemParentId: systemId, systemId: [] }));
    if (systemId && (Array.isArray(systemId) ? systemId.length > 0 : true)) {
      const ids = Array.isArray(systemId) ? systemId : [systemId];
      const results = await Promise.all(ids.map(id => dataService.getSystems(id)));
      setFilterOptions((prev: any) => ({ ...prev, subSystems: results.flat() }));
    } else {
      setFilterOptions((prev: any) => ({ ...prev, subSystems: [] }));
    }
  };

  const handleOrderTypeChange = async (id: string | string[]) => {
    setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, orderTypeId: id, orderTypeSubId: [] }));
    if (id && (Array.isArray(id) ? id.length > 0 : true)) {
      const ids = Array.isArray(id) ? id : [id];
      const results = await Promise.all(ids.map(item => dataService.getOrderSubTypesByType(item)));
      setOrderSubTypes(results.flat());
    } else {
      setOrderSubTypes([]);
    }
  };

  const handleAssetTagChange = async (id: string | string[]) => {
    let singleId: string[] = [];
    if (Array.isArray(id)) {
      if (id.length > 0) {
        singleId = [String(id[id.length - 1])];
      }
    } else if (id) {
      singleId = [String(id)];
    }

    setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, assetTagId: singleId, assetTagSubId: [] }));
    if (singleId.length > 0) {
      const results = await dataService.getAssetTagSubs(singleId[0], 'active');
      setAssetTagSubs(results);
    } else {
      setAssetTagSubs([]);
    }
  };

  const handleParentUnitTypeChange = async (id: string | string[]) => {
    setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, unitTypeParentId: id, unitTypeId: [], unitId: [] }));
    if (id && (Array.isArray(id) ? id.length > 0 : true)) {
      const ids = Array.isArray(id) ? id : [id];
      const results = await Promise.all(ids.map(item => dataService.getUnitTypes(item)));
      setUnitSubTypes(results.flat());
    } else {
      setUnitSubTypes([]);
    }
  };

  const handleApply = useCallback(() => {
    const selectedSectors = Array.isArray(advancedOrdersFilters.assetTagId)
      ? advancedOrdersFilters.assetTagId.filter(Boolean)
      : (advancedOrdersFilters.assetTagId ? [advancedOrdersFilters.assetTagId] : []);

    if (selectedSectors.length === 0) {
      toast.error('O filtro de SETOR é obrigatório. Selecione um setor.');
      return;
    }
    if (selectedSectors.length > 1) {
      toast.error('Apenas um setor deve ser selecionado.');
      return;
    }

    const selectedContracts = Array.isArray(advancedOrdersFilters.contractId) ? advancedOrdersFilters.contractId : [];
    if (filterOptions.contracts.length > 0 && selectedContracts.length === 0) {
      toast.error('Selecione ao menos um contrato para filtrar');
      return;
    }

    const newFilters = { ...advancedOrdersFilters, assetTagId: [selectedSectors[0]] };
    setAppliedFilters(newFilters);
    fetchGrantOrders(newFilters, selectedYear);
  }, [advancedOrdersFilters, filterOptions.contracts.length, selectedYear, fetchGrantOrders]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    fetchGrantOrders(appliedFilters, year);
  };

  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Filter units and OSs according to search query
  const filteredUnits = useMemo(() => {
    const visibleUnits = unitsData
      .map(unit => ({
        ...unit,
        bars: showAuthorizedOrders
          ? unit.bars
          : unit.bars.filter(bar => !bar.wasAuthorized),
      }))
      .filter(unit => unit.bars.length > 0);

    if (!search.trim()) return visibleUnits;

    const term = search.toLowerCase().trim();
    return visibleUnits
      .map(unit => {
        const unitMatches = unit.name.toLowerCase().includes(term);
        const matchingBars = unit.bars.filter(
          b =>
            b.orderMask.toLowerCase().includes(term) ||
            (b.requestedServices && b.requestedServices.toLowerCase().includes(term)) ||
            (b.orderDescription && b.orderDescription.toLowerCase().includes(term))
        );

        if (unitMatches) return unit;
        if (matchingBars.length > 0) return { ...unit, bars: matchingBars };
        return null;
      })
      .filter((u): u is UnitGroup => u !== null);
  }, [unitsData, search, showAuthorizedOrders]);

  // ── KPI Statistics (Total OS's, OS's Suspensas, OS's Concluídas) ──
  const kpiStats = useMemo(() => {
    const uniqueOrders = new Map<string, PlottedOSBar>();
    filteredUnits.forEach(u => {
      u.bars.forEach(b => {
        if (!uniqueOrders.has(b.oId)) {
          uniqueOrders.set(b.oId, b);
        }
      });
    });

    const total = uniqueOrders.size;
    let suspended = 0;
    let completed = 0;

    uniqueOrders.forEach(b => {
      if (b.statusId === 6) {
        suspended++;
      }
      if (b.statusId === 8) {
        completed++;
      }
    });

    const suspendedPercent = total > 0 ? Math.round((suspended / total) * 100) : 0;
    const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      suspended,
      suspendedPercent,
      completed,
      completedPercent,
    };
  }, [filteredUnits]);

  // Render a capsule according to its style
  const renderCapsule = (bar: PlottedOSBar) => {
    switch (bar.style) {
      case 'solid-green':
        return (
          <div className="relative z-20 flex items-center justify-between w-full h-[26px] px-2.5 rounded-full bg-[#10b981] text-white text-[10px] font-bold shadow-sm shadow-emerald-950/40 select-none overflow-visible hover:brightness-110 transition-all cursor-pointer">
            <span className="whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{bar.label}</span>
            {bar.badge && (
              <span className="ml-1.5 shrink-0 px-1.5 py-0.5 rounded-full bg-emerald-700/60 text-[9px] font-bold">
                {bar.badge}
              </span>
            )}
          </div>
        );

      case 'outline-green':
        return (
          <div className="relative z-20 flex items-center justify-center w-full h-[26px] px-2 rounded-full border border-[#10b981] bg-[#10b981] text-white text-[10px] font-bold shadow-sm select-none overflow-visible hover:brightness-110 transition-all cursor-pointer">
            <span className="whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{bar.label}</span>
          </div>
        );

      case 'solid-cyan':
        return (
          <div className="relative z-20 flex items-center justify-between w-full h-[26px] px-2.5 rounded-full bg-[#0284c7] text-white text-[10px] font-bold shadow-md shadow-sky-900/30 select-none overflow-visible hover:brightness-110 transition-all cursor-pointer">
            <span className="whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{bar.label}</span>
            {bar.badge && (
              <span className="ml-1.5 shrink-0 px-1.5 py-0.5 rounded-full bg-sky-900/70 text-[9px] font-bold">
                {bar.badge}
              </span>
            )}
          </div>
        );

      case 'outline-cyan':
        return (
          <div className="relative z-20 flex items-center justify-center w-full h-[26px] px-2 rounded-full border border-sky-500 bg-sky-100 text-sky-700 text-[10px] font-bold shadow-sm select-none overflow-visible hover:bg-sky-200 dark:border-[#38bdf8] dark:bg-[#0c4a6e]/30 dark:text-[#38bdf8] dark:hover:bg-[#0c4a6e]/60 transition-all cursor-pointer">
            <span className="whitespace-nowrap dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{bar.label}</span>
          </div>
        );

      case 'gradient-orange-red':
        return (
          <div className="relative z-20 flex items-center justify-between w-full h-[28px] px-2.5 rounded-full bg-gradient-to-r from-[#ea580c] to-[#dc2626] text-white text-[10px] font-bold shadow-lg shadow-orange-950/40 select-none overflow-visible hover:brightness-110 transition-all cursor-pointer">
            <span className="whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{bar.label}</span>
            <div className="flex items-center gap-1 ml-1.5 shrink-0 px-1.5 py-0.5 rounded-full bg-black/30 border border-white/20 text-[8px]">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span>{bar.badge}</span>
            </div>
          </div>
        );

      case 'outline-red':
        return (
          <div className="relative z-20 flex items-center justify-center w-full h-[26px] px-2 rounded-full border border-red-500 bg-red-100 text-red-700 text-[10px] font-bold shadow-sm select-none overflow-visible hover:bg-red-200 dark:border-[#ef4444] dark:bg-[#7f1d1d]/40 dark:text-[#fca5a5] dark:hover:bg-[#7f1d1d]/70 transition-all cursor-pointer">
            <span className="whitespace-nowrap dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{bar.label}</span>
          </div>
        );

      case 'outline-amber':
        return (
          <div className="relative z-20 flex items-center justify-center w-full h-[26px] px-2 rounded-full border border-amber-500 bg-amber-100 text-amber-700 text-[10px] font-bold shadow-sm select-none overflow-visible hover:bg-amber-200 dark:border-[#f59e0b] dark:bg-[#78350f]/30 dark:text-[#fcd34d] dark:hover:bg-[#78350f]/60 transition-all cursor-pointer">
            <span className="whitespace-nowrap dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{bar.label}</span>
          </div>
        );

      default:
        return null;
    }
  };

  const renderUnitRow = (unit: UnitGroup) => {
    const weekCells: React.ReactNode[] = [];
    let w = 0;
    const renderedBars = new Set<string>();
    const getAuthorizationWeek = (bar: PlottedOSBar) => (
      bar.wasAuthorized &&
      (bar.statusId === 6 || bar.statusId === 8) &&
      bar.authorizedAt
        ? dateToWeekIndex(bar.authorizedAt, selectedYear)
        : null
    );
    const getTimelineStartWeek = (bar: PlottedOSBar) => {
      const authorizationWeek = getAuthorizationWeek(bar);
      return authorizationWeek === null ? bar.startWeek : Math.min(bar.startWeek, authorizationWeek);
    };
    const getTimelineEndWeek = (bar: PlottedOSBar) => {
      const authorizationWeek = getAuthorizationWeek(bar);
      return authorizationWeek === null ? bar.endWeek : Math.max(bar.endWeek, authorizationWeek);
    };

    while (w < TOTAL_WEEKS) {
      const monthIdx = Math.floor(w / 4);
      const weekInMonth = w % 4;
      const isCurrentMonth = monthIdx === currentMonthIndex && selectedYear === currentYear;
      const isCurrentWeek = isCurrentMonth && weekInMonth === currentWeekInMonth;
      const isMonthEnd = weekInMonth === 3;

      const startingBars = unit.bars.filter(b => getTimelineStartWeek(b) === w && !renderedBars.has(b.id));

      if (startingBars.length > 0) {
        const maxSpan = Math.max(...startingBars.map(b => getTimelineEndWeek(b) - w + 1));
        const effectiveSpan = Math.min(maxSpan, TOTAL_WEEKS - w);
        const hasAuthorizationMarker = startingBars.some(b => getAuthorizationWeek(b) !== null);

        startingBars.forEach(b => renderedBars.add(b.id));

        const borderClass = (w + effectiveSpan) % 4 === 0 ? 'border-r-2 border-slate-300 dark:border-[#1e2a44]' : 'border-r border-slate-200 dark:border-[#1e2a44]/50';

        weekCells.push(
          <td
            key={`${unit.id}-w-${w}`}
            colSpan={effectiveSpan}
            className={`relative ${startingBars.some(bar => bar.id === hoveredBar?.bar.id) ? 'z-50' : 'z-10'} overflow-visible px-1 py-2 align-middle ${borderClass} ${
              isCurrentWeek ? 'bg-sky-500/10' : (isCurrentMonth ? 'bg-sky-500/5' : '')
            }`}
            style={{ minWidth: effectiveSpan * 34 }}
          >
            <div className="flex flex-col gap-1.5 w-full">
              {startingBars.map(bar => (
                (() => {
                  const authorizationWeek = getAuthorizationWeek(bar);
                  const barSpan = bar.endWeek - bar.startWeek + 1;
                  const barOffsetWeeks = bar.startWeek - w;
                  const authorizationOffsetWeeks = authorizationWeek === null ? 0 : authorizationWeek - w;
                  const hasMarker = authorizationWeek !== null;
                  const cellWidth = effectiveSpan * 34;
                  const barWidth = barSpan * 34;
                  const barCenter = barOffsetWeeks * 34 + barWidth / 2;
                  const authorizationCenter = authorizationOffsetWeeks * 34 + 17;
                  const connectorPath = authorizationWeek === null
                    ? ''
                    : authorizationCenter === barCenter
                      ? `M ${authorizationCenter} 28 V 42`
                      : (() => {
                          const direction = barCenter > authorizationCenter ? 1 : -1;
                          const radius = Math.min(4, Math.abs(barCenter - authorizationCenter) / 2);
                          const authTurn = authorizationCenter + direction * radius;
                          const barTurn = barCenter - direction * radius;
                          return `M ${authorizationCenter} 28 V 32 Q ${authorizationCenter} 36 ${authTurn} 36 H ${barTurn} Q ${barCenter} 36 ${barCenter} 40 V 42`;
                        })();

                  return (
                    <div
                      key={bar.id}
                      tabIndex={0}
                      aria-label={`OS ${bar.orderMask}, ${bar.statusId === 8 ? 'Concluída' : bar.statusId === 6 ? 'Suspensa' : bar.statusDescription || 'Em andamento'}`}
                      className="group/bar relative focus:outline-none"
                      onMouseEnter={event => updateBarTooltipPosition(bar, event.currentTarget)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onFocus={event => updateBarTooltipPosition(bar, event.currentTarget)}
                      onBlur={() => setHoveredBar(null)}
                      style={{ width: cellWidth, minHeight: hasMarker ? 68 : 26 }}
                    >
                      {hasMarker && (
                        <>
                          <svg
                            aria-hidden="true"
                            className="pointer-events-none absolute left-0 top-0 z-0 h-[42px] overflow-visible"
                            width={cellWidth}
                            height="42"
                          >
                            <path
                              d={connectorPath}
                              className="stroke-sky-400 dark:stroke-sky-500"
                              fill="none"
                              strokeWidth="1"
                            />
                          </svg>
                          <span
                            title={`Autorizada em ${bar.authorizedAt ? formatGrantDate(bar.authorizedAt) : 'data não informada'}`}
                            aria-label={`Autorizada no dia ${new Date(bar.authorizedAt!).getDate()}`}
                            className="absolute top-0 z-10 inline-flex h-7 min-w-[52px] -translate-x-1/2 items-center justify-center gap-1 rounded-full border border-sky-200 bg-white px-2 text-[11px] font-bold leading-none text-sky-700 shadow-sm dark:border-sky-500/30 dark:bg-slate-900 dark:text-sky-300"
                            style={{ left: authorizationCenter }}
                          >
                            <span className="material-symbols-outlined text-[15px] leading-none">verified</span>
                            <span>{String(new Date(bar.authorizedAt!).getDate()).padStart(2, '0')}</span>
                          </span>
                        </>
                      )}
                      <div
                        className="absolute top-[42px]"
                        style={{
                          left: barOffsetWeeks * 34,
                          width: barWidth,
                          top: hasMarker ? 42 : 0,
                        }}
                      >
                        {renderCapsule(bar)}
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          </td>
        );
        w += effectiveSpan;
      } else {
        const isCovered = unit.bars.some(
          b => renderedBars.has(b.id) && w >= getTimelineStartWeek(b) && w <= getTimelineEndWeek(b)
        );
        if (isCovered) {
          w++;
        } else {
          const borderClass = isMonthEnd ? 'border-r-2 border-slate-300 dark:border-[#1e2a44]' : 'border-r border-slate-200 dark:border-[#1e2a44]/40';
          weekCells.push(
            <td
              key={`${unit.id}-empty-w-${w}`}
              className={`px-0.5 py-2 ${borderClass} ${
                isCurrentWeek ? 'bg-sky-500/10' : (isCurrentMonth ? 'bg-sky-500/5' : '')
              }`}
              style={{ minWidth: 34, width: 34 }}
            />
          );
          w++;
        }
      }
    }

    return (
      <tr
        key={unit.id}
        className="border-b border-slate-200 dark:border-[#1e2a44] hover:bg-slate-50 dark:hover:bg-[#131e38]/50 transition-colors"
      >
        <td
          className="sticky left-0 z-10 bg-white dark:bg-[#090f1d] px-4 py-3 border-r-2 border-slate-300 dark:border-[#1e2a44] font-bold text-xs text-slate-700 dark:text-slate-200 tracking-wider whitespace-nowrap"
          style={
            unitColWidth !== null
              ? { width: unitColWidth, minWidth: unitColWidth, maxWidth: unitColWidth }
              : { width: '1%', minWidth: 'max-content', whiteSpace: 'nowrap' }
          }
          title={unit.name}
        >
          {unit.name}
        </td>
        {weekCells}
      </tr>
    );
  };

  const selectedSectorName = useMemo(() => {
    const sId = Array.isArray(appliedFilters.assetTagId) && appliedFilters.assetTagId[0];
    if (!sId) return '';
    const match = filterOptions.sectors.find((s: any) => String(s.id) === String(sId));
    return match ? (match.description || match.name) : '';
  }, [appliedFilters.assetTagId, filterOptions.sectors]);

  return (
    <>
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-[#050914] text-slate-800 dark:text-slate-200">

      {/* ── Filter Bar (from OrdersRequestsDashboardAdmin) ── */}
      <div className="z-30 bg-white dark:bg-[#090f1d] border-b border-slate-200 dark:border-[#17233f] shadow-sm shrink-0">
        <div className="flex flex-col p-4">
          <div className="flex items-center gap-2">
            <FilterBarResponsive
              ref={filterBarRef}
              advancedFilters={advancedOrdersFilters}
              setAdvancedFilters={setAdvancedOrdersFilters}
              filterSelectOptions={filterOptions}
              handleSystemChange={handleSystemChange}
              handleParentUnitTypeChange={handleParentUnitTypeChange}
              handleOrderTypeChange={handleOrderTypeChange}
              handleSectorChange={handleAssetTagChange}
              unitSubTypes={unitSubTypes}
              assetTagSubOptions={assetTagSubs}
              orderSubTypes={orderSubTypes}
              showMaintenancePlanFilter
              onActiveFiltersChange={(count) => {
                setOsFilterCount(count);
                onMobileFilterCountChange?.(count);
              }}
              onApply={handleApply}
            />
            <button
              type="button"
              onClick={handleApply}
              disabled={isLoading}
              className="hidden md:inline-flex items-center justify-center gap-2 h-12 px-6 font-bold rounded-xl transition-all focus:outline-none bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-lg shadow-sky-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
            >
              <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin' : ''}`}>
                {isLoading ? 'progress_activity' : 'filter_alt'}
              </span>
              <span className="tracking-wider text-xs uppercase font-extrabold">{isLoading ? 'Filtrando...' : 'FILTRAR'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-controls Bar: Year Selector, Current Sector indicator & View Mode Toggle ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Years Group */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-[#17233f] p-1 rounded-xl">
            {years.map(y => {
              const isActive = selectedYear === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearChange(y)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#131e38]'
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>

          {/* Current Mandatory Sector Badge */}
          {selectedSectorName && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-[#17233f] text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Setor:</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">{selectedSectorName}</span>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-[#17233f] p-1 rounded-xl">
          {(['monthly', 'quarterly'] as const).map(mode => {
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#131e38]'
                }`}
              >
                {mode === 'monthly' ? 'Mensal' : 'Trimestral'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Timeline Card ── */}
      <div className="flex-1 px-6 pb-6">
        <div className="flex flex-col h-full bg-white dark:bg-[#090f1d] border border-slate-200 dark:border-[#17233f] rounded-2xl overflow-hidden shadow-2xl">

          {/* Card Top Header: Search input on left, Legend on right */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-[#17233f] bg-slate-50 dark:bg-[#070c18]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-80 max-w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar unidade ou OS..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#0d162d] border border-slate-200 dark:border-[#1e2a44] text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0284c7] transition-all"
                />
              </div>
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-[#1e2a44] bg-white dark:bg-[#0d162d] px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-[#0284c7]/60 transition-colors">
                <input
                  type="checkbox"
                  checked={showAuthorizedOrders}
                  onChange={e => setShowAuthorizedOrders(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-[#090f1d] text-[#0284c7] focus:ring-[#0284c7] focus:ring-offset-0"
                />
                Mostrar OS's Autorizadas
              </label>
            </div>

            {/* OS Statistics: Total, Suspensas, Concluídas */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#0d162d] border border-slate-200 dark:border-[#1e2a44] px-3 py-1.5 rounded-xl shadow-sm">
                <span className="text-slate-400 dark:text-slate-400">Total OS's:</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{kpiStats.total}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-[#0d162d] border border-slate-200 dark:border-[#1e2a44] px-3 py-1.5 rounded-xl shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-slate-400 dark:text-slate-400">OS's Suspensas:</span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                  {kpiStats.suspended} ({kpiStats.suspendedPercent}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-[#0d162d] border border-slate-200 dark:border-[#1e2a44] px-3 py-1.5 rounded-xl shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400 dark:text-slate-400">OS's Concluídas:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {kpiStats.completed} ({kpiStats.completedPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Gantt Table with Weeks inside each month */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse" style={{ minWidth: 1680 }}>
              <thead>
                {/* Row 1: Months / Quarters */}
                <tr className="bg-slate-100 dark:bg-[#070c18] border-b border-slate-200 dark:border-[#1e2a44] sticky top-0 z-20">
                  <th
                    ref={thRef}
                    rowSpan={2}
                    className="relative sticky left-0 z-30 bg-slate-100 dark:bg-[#070c18] text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-r-2 border-slate-300 dark:border-[#1e2a44] border-b-2 border-slate-300 dark:border-[#2b3d63] select-none whitespace-nowrap shadow-[inset_0_-2px_0_#cbd5e1] dark:shadow-[inset_0_-2px_0_#2b3d63]"
                    style={
                      unitColWidth !== null
                        ? { width: unitColWidth, minWidth: unitColWidth, maxWidth: unitColWidth }
                        : { width: '1%', minWidth: 'max-content', whiteSpace: 'nowrap' }
                    }
                  >
                    <div className="flex items-center justify-between pr-2">
                      <span>UNIDADES</span>
                      {unitColWidth !== null && (
                        <button
                          type="button"
                          onClick={handleDoubleClickResize}
                          title="Restaurar tamanho automático"
                          className="text-[10px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 ml-1.5 p-0.5 rounded hover:bg-sky-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                        </button>
                      )}
                    </div>
                    {/* Drag resize handle */}
                    <div
                      onMouseDown={handleMouseDownResize}
                      onDoubleClick={handleDoubleClickResize}
                      title="Arraste para ajustar ou clique duplo para auto-ajustar"
                      className="absolute top-0 right-0 w-3 h-full cursor-col-resize hover:bg-sky-500/40 transition-colors z-40 group flex items-center justify-center"
                    >
                      <div className="w-0.5 h-full bg-transparent group-hover:bg-sky-400" />
                    </div>
                  </th>

                  {viewMode === 'monthly' ? (
                    MONTHS_SHORT.map((month, i) => {
                      const isCurrentMonth = i === currentMonthIndex && selectedYear === currentYear;
                      return (
                        <th
                          key={month}
                          colSpan={4}
                          className={`px-2 py-2.5 text-center text-[11px] uppercase tracking-wider border-r-2 border-slate-200 dark:border-[#1e2a44] ${
                            isCurrentMonth
                              ? 'text-sky-600 dark:text-[#38bdf8] font-black bg-sky-500/10'
                              : 'text-slate-600 dark:text-slate-300 font-bold bg-transparent'
                          }`}
                        >
                          {month}
                        </th>
                      );
                    })
                  ) : (
                    QUARTERS.map(q => (
                      <th
                        key={q}
                        colSpan={12}
                        className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-r-2 border-slate-200 dark:border-[#1e2a44] bg-transparent"
                      >
                        {q}
                      </th>
                    ))
                  )}
                </tr>

                {/* Row 2: Weeks (S1, S2, S3, S4) inside each month */}
                <tr className="bg-white dark:bg-[#090f1d] border-b border-slate-200 dark:border-[#1e2a44] sticky top-[38px] z-20">
                  {MONTHS_SHORT.map((month, mIdx) => {
                    const isCurrentMonth = mIdx === currentMonthIndex && selectedYear === currentYear;
                    return ['S1', 'S2', 'S3', 'S4'].map((wLabel, wIdx) => {
                      const isCurrentWeek = isCurrentMonth && wIdx === currentWeekInMonth;
                      const isMonthEnd = wIdx === 3;
                      return (
                        <th
                          key={`${month}-${wLabel}`}
                          className={`py-1 px-0.5 text-center text-[10px] uppercase font-semibold select-none border-b-2 border-slate-200 dark:border-[#2b3d63] shadow-[inset_0_-2px_0_#e2e8f0] dark:shadow-[inset_0_-2px_0_#2b3d63] ${
                            isMonthEnd ? 'border-r-2 border-slate-200 dark:border-[#1e2a44]' : 'border-r border-slate-100 dark:border-[#1e2a44]/50'
                          } ${
                            isCurrentWeek
                              ? 'text-sky-600 dark:text-sky-300 font-bold bg-sky-500/20'
                              : (isCurrentMonth ? 'text-sky-600/80 dark:text-sky-400/80 bg-sky-500/5' : 'text-slate-400 dark:text-slate-400')
                          }`}
                          style={{ minWidth: 34, width: 34 }}
                        >
                          {wLabel}
                        </th>
                      );
                    });
                  })}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={49} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <span className="material-symbols-outlined text-4xl animate-spin text-[#0284c7]">
                          progress_activity
                        </span>
                        <span className="text-sm font-medium">Carregando Ordens de Serviço do setor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={49} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined text-4xl">search_off</span>
                        <span className="text-sm font-medium">
                          {hasQueried
                            ? 'Nenhuma Ordem de Serviço encontrada com os filtros selecionados para este setor.'
                            : 'Selecione um setor no filtro acima e clique em FILTRAR para carregar as OSs.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map(unit => renderUnitRow(unit))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
    {hoveredBar && createPortal(
      <div
        role="tooltip"
        className="pointer-events-none fixed w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900"
        style={{
          left: hoveredBar.left,
          top: hoveredBar.top,
          zIndex: 10000,
          transform: hoveredBar.placement === 'above' ? 'translateY(-100%)' : undefined,
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
            OS {hoveredBar.bar.orderMask}
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            hoveredBar.bar.statusId === 8
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : hoveredBar.bar.statusId === 6
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                : 'bg-primary/10 text-primary'
          }`}>
            {hoveredBar.bar.statusId === 8 ? 'Concluída' : hoveredBar.bar.statusId === 6 ? 'Suspensa' : hoveredBar.bar.statusDescription || 'Em andamento'}
          </span>
        </div>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Início</dt>
            <dd className="text-right font-medium text-slate-700 dark:text-slate-200">
              {hoveredBar.bar.startDateStr ? formatGrantDate(hoveredBar.bar.startDateStr) : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Fim</dt>
            <dd className="text-right font-medium text-slate-700 dark:text-slate-200">
              {hoveredBar.bar.endDateStr ? formatGrantDate(hoveredBar.bar.endDateStr) : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">Visitas</dt>
            <dd className="font-semibold text-slate-700 dark:text-slate-200">{hoveredBar.bar.visitsCount}</dd>
          </div>
          {hoveredBar.bar.statusId !== 8 && (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Progresso</dt>
              <dd className="font-semibold text-slate-700 dark:text-slate-200">{hoveredBar.bar.progress}%</dd>
            </div>
          )}
        </dl>
      </div>,
      document.body
    )}
    </>
  );
};
