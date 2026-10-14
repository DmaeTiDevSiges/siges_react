import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { formatDateInBrazil } from '../../utils/formatters';

import { User, OrderFilters, Order } from '../../types';
import { dataService } from '../../services/dataService';
import { FilterBarResponsive, FilterBarResponsiveHandle } from '../../components/ui/FilterBarResponsive';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

type GrantStatus = 'completed' | 'running' | 'planned' | 'critical';

type CapsuleStyle = 'solid-green' | 'outline-green' | 'solid-cyan' | 'outline-cyan' | 'gradient-orange-red' | 'outline-red' | 'outline-amber';

interface PlottedOSBar {
  id: string;
  oId: string;
  orderMask: string;
  orderTypeCode: string;
  orderTypeSubCode: string;
  sectorId?: string;
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
  sectorDescription: string;
  positionDescription: string;
  causeDescription: string;
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
const TOTAL_WEEKS = 48; // 12 months * 4 weeks
const SECTOR_DOT_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-fuchsia-500',
];

const getSectorDotColor = (sectorId: string): string => {
  let hash = 0;
  for (let index = 0; index < sectorId.length; index++) {
    hash = (hash * 31 + sectorId.charCodeAt(index)) | 0;
  }
  return SECTOR_DOT_COLORS[Math.abs(hash) % SECTOR_DOT_COLORS.length];
};

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
  onSelectOrder?: (order: Order) => void;
  onFilterBarRef?: (ref: FilterBarResponsiveHandle | null) => void;
  onMobileFilterCountChange?: (count: number) => void;
}

export const GrantDashboardScreen: React.FC<GrantDashboardScreenProps> = ({
  currentUser,
  onNavigate: _onNavigate,
  onSelectOrder,
  onFilterBarRef,
  onMobileFilterCountChange,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const currentDay = new Date().getDate();
  const currentWeekInMonth = currentDay <= 7 ? 0 : currentDay <= 14 ? 1 : currentDay <= 21 ? 2 : 3;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [yearPickerDecade, setYearPickerDecade] = useState(Math.floor(currentYear / 10) * 10);
  const [search, setSearch] = useState('');
  const [showAuthorizedOrders, setShowAuthorizedOrders] = useState(true);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  // ── Auto-adjustable and resizable UNIDADES column ──
  const [unitColWidth, setUnitColWidth] = useState<number | null>(null);
  const [autoUnitColWidth, setAutoUnitColWidth] = useState(160);
  const unitMeasureRef = useRef<HTMLSpanElement>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const thRef = useRef<HTMLTableCellElement>(null);
  const tableDragRef = useRef<{
    element: HTMLDivElement;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    moved: boolean;
  } | null>(null);
  const suppressTableClickRef = useRef(false);

  const handleTableMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest('button, input, a, .cursor-col-resize')) return;

    tableDragRef.current = {
      element: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
      moved: false,
    };
  };

  const handleTableClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressTableClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressTableClickRef.current = false;
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const drag = tableDragRef.current;
      if (!drag) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(deltaX, deltaY) < 4) return;

      drag.moved = true;
      drag.element.scrollLeft = drag.scrollLeft - deltaX;
      drag.element.scrollTop = drag.scrollTop - deltaY;
      event.preventDefault();
      setHoveredBar(null);
    };

    const handleMouseUp = () => {
      if (tableDragRef.current?.moved) {
        suppressTableClickRef.current = true;
        window.setTimeout(() => {
          suppressTableClickRef.current = false;
        }, 0);
      }
      tableDragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipHideTimerRef = useRef<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{
    bar: PlottedOSBar;
    anchor: HTMLElement;
    left: number;
    top: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [_osFilterCount, setOsFilterCount] = useState(0);

  // Real Plotted Data from DB
  const [unitsData, setUnitsData] = useState<UnitGroup[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const updateBarTooltipPosition = useCallback((bar: PlottedOSBar, anchor: HTMLElement) => {
    const capsule = anchor.querySelector<HTMLElement>('[data-os-capsule]');
    const rect = capsule ? capsule.getBoundingClientRect() : anchor.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const maxTooltipHeight = Math.max(100, viewportHeight - 16);
    const tooltipHeight = Math.min(tooltipRef.current?.offsetHeight || 220, maxTooltipHeight);
    const spaceAbove = rect.top - 4;
    const spaceBelow = viewportHeight - rect.bottom - 4;
    let top: number;

    if (spaceAbove >= tooltipHeight) {
      top = rect.top - tooltipHeight - 4;
    } else if (spaceBelow >= tooltipHeight) {
      top = rect.bottom + 4;
    } else {
      top = Math.max(4, Math.min(rect.top - tooltipHeight / 2, viewportHeight - tooltipHeight - 4));
    }

    const tooltipWidth = tooltipRef.current?.offsetWidth || 276;
    const viewportWidth = window.innerWidth;
    const maxLeft = viewportWidth - tooltipWidth - 4;
    let left: number;
    if (rect.left + tooltipWidth <= viewportWidth - 4) {
      left = rect.left;
    } else if (rect.right - tooltipWidth >= 4) {
      left = rect.right - tooltipWidth;
    } else {
      left = Math.max(4, Math.min(rect.left, maxLeft));
    }
    setHoveredBar({
      bar,
      anchor,
      left,
      top,
    });
  }, []);

  const scheduleTooltipHide = useCallback(() => {
    if (tooltipHideTimerRef.current) window.clearTimeout(tooltipHideTimerRef.current);
    tooltipHideTimerRef.current = window.setTimeout(() => setHoveredBar(null), 150);
  }, []);

  const cancelTooltipHide = useCallback(() => {
    if (tooltipHideTimerRef.current) {
      window.clearTimeout(tooltipHideTimerRef.current);
      tooltipHideTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (tooltipHideTimerRef.current) window.clearTimeout(tooltipHideTimerRef.current);
  }, []);

  const handleTooltipOsClick = async () => {
    const bar = hoveredBar?.bar;
    if (!bar) return;
    try {
      const order = await dataService.getOrderById(bar.oId);
      if (order) {
        setHoveredBar(null);
        onSelectOrder?.(order);
      } else {
        toast.error('OS não encontrada.');
      }
    } catch {
      toast.error('Erro ao carregar OS.');
    }
  };

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
    // Sector is optional; when omitted, all sectors are returned
    const selectedSectors = Array.isArray(filters.assetTagId)
      ? filters.assetTagId.filter(Boolean)
      : (filters.assetTagId ? [filters.assetTagId] : []);

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
          assetTagId: selectedSectors.length > 0 ? selectedSectors.map(String) : undefined,
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
        orderTypeCode: string;
        orderTypeSubCode: string;
        sectorId?: string;
        orderDescription: string;
        requestedServices: string;
        unitId: string;
        unitDescription: string;
        sectorDescription: string;
        positionDescription: string;
        causeDescription: string;
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
            orderTypeCode: row.o_type_code || '',
            orderTypeSubCode: row.o_type_sub_code || '',
            sectorId: row.o_asset_tag_id ? String(row.o_asset_tag_id) : undefined,
            orderDescription: row.o_description || row.o_type_description || '',
            requestedServices: row.o_requested_services || '',
            unitId: String(row.o_unit_id || ''),
            unitDescription: row.o_unit_description || row.unit_description || 'Unidade Sem Nome',
            sectorDescription: row.o_asset_tag_description || '',
            positionDescription: row.o_asset_tag_sub_description || '',
            causeDescription: row.o_cause_reason_description || '',
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
          orderTypeCode: os.orderTypeCode,
          orderTypeSubCode: os.orderTypeSubCode,
          sectorId: os.sectorId,
          label: '',
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
          sectorDescription: os.sectorDescription,
          positionDescription: os.positionDescription,
          causeDescription: os.causeDescription,
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
    const selectedIds = (Array.isArray(id) ? id : id ? [id] : []).map(String);

    setAdvancedOrdersFilters((prev: OrderFilters) => ({ ...prev, assetTagId: selectedIds, assetTagSubId: [] }));
    if (selectedIds.length > 0) {
      const results = await Promise.all(selectedIds.map(sectorId => dataService.getAssetTagSubs(sectorId, 'active')));
      setAssetTagSubs(results.flat());
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

    const selectedContracts = Array.isArray(advancedOrdersFilters.contractId) ? advancedOrdersFilters.contractId : [];
    if (filterOptions.contracts.length > 0 && selectedContracts.length === 0) {
      toast.error('Selecione ao menos um contrato para filtrar');
      return;
    }

    const newFilters = {
      ...advancedOrdersFilters,
      assetTagId: selectedSectors.map(String),
    };
    setAppliedFilters(newFilters);
    fetchGrantOrders(newFilters, selectedYear);
  }, [advancedOrdersFilters, filterOptions.contracts.length, selectedYear, fetchGrantOrders]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setIsYearPickerOpen(false);
    fetchGrantOrders(appliedFilters, year);
  };

  useEffect(() => {
    if (!isYearPickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !yearPickerRef.current?.contains(event.target)) {
        setIsYearPickerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsYearPickerOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isYearPickerOpen]);

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

  // Auto-adjust UNIDADES column width to fit the longest unit name
  useEffect(() => {
    if (unitColWidth !== null) return;
    const el = unitMeasureRef.current;
    if (!el) return;
    let max = 0;
    for (const unit of filteredUnits) {
      el.textContent = unit.name;
      max = Math.max(max, el.offsetWidth);
    }
    el.textContent = 'UNIDADES';
    max = Math.max(max, el.offsetWidth);
    if (max > 0) setAutoUnitColWidth(Math.min(600, max + 52));
  }, [filteredUnits, unitColWidth]);

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

  const renderSectorDot = (bar: PlottedOSBar) => bar.sectorId ? (
    <span
      aria-label={`Setor: ${bar.sectorDescription || bar.sectorId}`}
      title={bar.sectorDescription || bar.sectorId}
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/70 ${getSectorDotColor(bar.sectorId)}`}
    />
  ) : null;

  // Render a capsule according to its style
  const renderCapsule = (bar: PlottedOSBar) => {
    switch (bar.style) {
      case 'solid-green':
        return (
          <div className="relative z-20 flex items-center justify-between w-full h-[26px] px-2 rounded-full bg-[#10b981] text-white text-[10px] font-bold shadow-sm shadow-emerald-950/40 select-none overflow-hidden hover:brightness-110 transition-all cursor-pointer">
            {renderSectorDot(bar)}
            {bar.badge && (
              <span className="ml-1.5 shrink-0 px-1.5 py-0.5 rounded-full bg-emerald-700/60 text-[9px] font-bold">
                {bar.badge}
              </span>
            )}
          </div>
        );

      case 'outline-green':
        return (
          <div className="relative z-20 flex items-center justify-center w-full h-[26px] px-2 rounded-full border border-[#10b981] bg-[#10b981] text-white text-[10px] font-bold shadow-sm select-none overflow-hidden hover:brightness-110 transition-all cursor-pointer">
            {renderSectorDot(bar)}
          </div>
        );

      case 'solid-cyan':
        return (
          <div className="relative z-20 flex items-center justify-between w-full h-[26px] px-2 rounded-full bg-[#0284c7] text-white text-[10px] font-bold shadow-md shadow-sky-900/30 select-none overflow-hidden hover:brightness-110 transition-all cursor-pointer">
            {renderSectorDot(bar)}
            {bar.badge && (
              <span className="ml-1.5 shrink-0 px-1.5 py-0.5 rounded-full bg-sky-900/70 text-[9px] font-bold">
                {bar.badge}
              </span>
            )}
          </div>
        );

      case 'outline-cyan':
        return (
          <div className="relative z-20 flex items-center justify-center w-full h-[26px] px-2 rounded-full border border-sky-500 bg-sky-100 text-sky-700 text-[10px] font-bold shadow-sm select-none overflow-hidden hover:bg-sky-200 dark:border-[#38bdf8] dark:bg-[#0c4a6e]/30 dark:text-[#38bdf8] dark:hover:bg-[#0c4a6e]/60 transition-all cursor-pointer">
            {renderSectorDot(bar)}
          </div>
        );

      case 'gradient-orange-red':
        return (
          <div className="relative z-20 flex items-center justify-between w-full h-[28px] px-2 rounded-full bg-gradient-to-r from-[#ea580c] to-[#dc2626] text-white text-[10px] font-bold shadow-lg shadow-orange-950/40 select-none overflow-hidden hover:brightness-110 transition-all cursor-pointer">
            {renderSectorDot(bar)}
            <div className="flex items-center gap-1 ml-1.5 shrink-0 px-1.5 py-0.5 rounded-full bg-black/30 border border-white/20 text-[8px]">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span>{bar.badge}</span>
            </div>
          </div>
        );

      case 'outline-red':
        return (
          <div className="relative z-20 flex items-center justify-center w-full h-[26px] px-2 rounded-full border border-red-500 bg-red-100 text-red-700 text-[10px] font-bold shadow-sm select-none overflow-hidden hover:bg-red-200 dark:border-[#ef4444] dark:bg-[#7f1d1d]/40 dark:text-[#fca5a5] dark:hover:bg-[#7f1d1d]/70 transition-all cursor-pointer">
            {renderSectorDot(bar)}
          </div>
        );

      case 'outline-amber':
        return (
          <div className="relative z-20 flex items-center justify-center w-full h-[26px] px-2 rounded-full border border-amber-500 bg-amber-100 text-amber-700 text-[10px] font-bold shadow-sm select-none overflow-hidden hover:bg-amber-200 dark:border-[#f59e0b] dark:bg-[#78350f]/30 dark:text-[#fcd34d] dark:hover:bg-[#78350f]/60 transition-all cursor-pointer">
            {renderSectorDot(bar)}
          </div>
        );

      default:
        return null;
    }
  };

  const renderUnitRow = (unit: UnitGroup) => {
    const cellWidth = TOTAL_WEEKS * 34;
    const laneHeight = 44;
    const timelineBars = unit.bars.map(bar => {
      const authorizationWeek = bar.wasAuthorized && (bar.statusId === 6 || bar.statusId === 8) && bar.authorizedAt
        ? dateToWeekIndex(bar.authorizedAt, selectedYear)
        : null;
      const timelineStartWeek = authorizationWeek === null
        ? bar.startWeek
        : Math.max(0, Math.min(bar.startWeek, authorizationWeek) - 1);
      const timelineEndWeek = authorizationWeek === null
        ? bar.endWeek
        : Math.min(TOTAL_WEEKS - 1, Math.max(bar.endWeek, authorizationWeek) + 1);
      return {
        bar,
        authorizationWeek,
        startWeek: timelineStartWeek,
        endWeek: timelineEndWeek,
      };
    }).sort((a, b) => a.startWeek - b.startWeek || b.endWeek - a.endWeek || a.bar.id.localeCompare(b.bar.id));

    const laneEnds: number[] = [];
    const positionedBars = timelineBars.map(item => {
      let lane = laneEnds.findIndex(endWeek => endWeek < item.startWeek);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.endWeek;
      return { ...item, lane };
    });
    const timelineHeight = Math.max(1, laneEnds.length) * laneHeight;

    return (
      <tr
        key={unit.id}
        className="border-b border-slate-200 dark:border-[#1e2a44] hover:bg-slate-50 dark:hover:bg-[#131e38]/50 transition-colors"
      >
        <td
          className="sticky left-0 z-10 bg-white dark:bg-[#090f1d] px-4 py-3 border-r-2 border-slate-300 dark:border-[#1e2a44] font-bold text-xs text-slate-700 dark:text-slate-200 tracking-wider whitespace-nowrap"
          style={{ width: unitColWidth ?? autoUnitColWidth, minWidth: unitColWidth ?? autoUnitColWidth, maxWidth: unitColWidth ?? autoUnitColWidth }}
          title={unit.name}
        >
          {unit.name}
        </td>
        <td
          colSpan={TOTAL_WEEKS}
          className={`relative p-0 ${positionedBars.some(({ bar }) => bar.id === hoveredBar?.bar.id) ? 'z-50' : ''}`}
          style={{ width: cellWidth, minWidth: cellWidth }}
        >
          <div className="relative" style={{ width: cellWidth, height: timelineHeight }}>
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, 34px)` }}>
              {Array.from({ length: TOTAL_WEEKS }, (_, week) => {
                const monthIndex = Math.floor(week / 4);
                const isCurrentMonth = monthIndex === currentMonthIndex && selectedYear === currentYear;
                const isCurrentWeek = isCurrentMonth && week % 4 === currentWeekInMonth;
                const isMonthEnd = week % 4 === 3;
                return (
                  <div
                    key={`${unit.id}-week-bg-${week}`}
                    className={`h-full border-r ${isMonthEnd ? 'border-r-2 border-slate-300 dark:border-[#1e2a44]' : 'border-slate-200 dark:border-[#1e2a44]/40'} ${
                      isCurrentWeek ? 'bg-sky-500/10' : isCurrentMonth ? 'bg-sky-500/5' : ''
                    }`}
                  />
                );
              })}
            </div>
            {positionedBars.map(({ bar, authorizationWeek, startWeek, endWeek, lane }) => {
              const hasMarker = authorizationWeek !== null;
              const barWidth = (bar.endWeek - bar.startWeek + 1) * 34;
              const timelineOffset = (bar.startWeek - startWeek) * 34;
              const markerCenter = hasMarker ? (authorizationWeek - startWeek) * 34 + 17 : 0;
              const barCenter = timelineOffset + barWidth / 2;
              const connectorPath = !hasMarker
                ? ''
                : markerCenter === barCenter
                  ? `M ${markerCenter} 16 V 20`
                  : (() => {
                      const direction = barCenter > markerCenter ? 1 : -1;
                      const radius = Math.min(4, Math.abs(barCenter - markerCenter) / 2);
                      const markerTurn = markerCenter + direction * radius;
                      const barTurn = barCenter - direction * radius;
                      return `M ${markerCenter} 16 V 17 Q ${markerCenter} 20 ${markerTurn} 20 H ${barTurn} Q ${barCenter} 20 ${barCenter} 20 V 20`;
                    })();

              return (
                <div
                  key={bar.id}
                  tabIndex={0}
                  aria-label={`OS ${bar.orderMask}, ${bar.statusId === 8 ? 'Concluída' : bar.statusId === 6 ? 'Suspensa' : bar.statusDescription || 'Em andamento'}`}
                  className="group/bar absolute left-0 right-0 z-10 focus:outline-none"
                  onMouseEnter={event => updateBarTooltipPosition(bar, event.currentTarget)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onFocus={event => updateBarTooltipPosition(bar, event.currentTarget)}
                  onBlur={() => setHoveredBar(null)}
                  style={{
                    top: lane * laneHeight,
                    height: laneHeight,
                    left: startWeek * 34,
                    width: (endWeek - startWeek + 1) * 34,
                  }}
                >
                  {hasMarker && (
                    <>
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 top-0 z-0"
                        width={(endWeek - startWeek + 1) * 34}
                        height="20"
                      >
                        <path d={connectorPath} className="stroke-sky-400 dark:stroke-sky-500" fill="none" strokeWidth="1" />
                      </svg>
                      <span
                        title={`Autorizada em ${bar.authorizedAt ? formatGrantDate(bar.authorizedAt) : 'data não informada'}`}
                        aria-label={`Autorizada no dia ${new Date(bar.authorizedAt!).getDate()}`}
                        className="absolute top-0 z-10 inline-flex h-4 min-w-[48px] -translate-x-1/2 items-center justify-center gap-0.5 rounded-full border border-sky-200 bg-white px-1.5 text-[9px] font-bold leading-none text-sky-700 shadow-sm dark:border-sky-500/30 dark:bg-slate-900 dark:text-sky-300"
                        style={{ left: markerCenter }}
                      >
                        <span className="material-symbols-outlined text-[11px] leading-none">verified</span>
                        <span>{String(new Date(bar.authorizedAt!).getDate()).padStart(2, '0')}</span>
                      </span>
                    </>
                  )}
                  <div
                    data-os-capsule=""
                    className="absolute left-0"
                    style={{ left: timelineOffset, top: hasMarker ? 18 : 8, width: barWidth }}
                    title={`OS ${bar.orderMask}`}
                  >
                    {renderCapsule(bar)}
                  </div>
                </div>
              );
            })}
          </div>
        </td>
      </tr>
    );
  };

  const selectedSectors = useMemo(() => {
    const ids = Array.isArray(appliedFilters.assetTagId)
      ? appliedFilters.assetTagId
      : appliedFilters.assetTagId ? [appliedFilters.assetTagId] : [];
    return ids.map(id => {
      const sectorId = String(id);
      const sector = filterOptions.sectors.find((item: any) => String(item.id) === sectorId);
      return {
        id: sectorId,
        name: sector?.description || sector?.name || sectorId,
      };
    });
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
              onClick={() => filterBarRef.current?.openMobileFilters()}
              className="relative md:hidden flex items-center justify-center gap-2 h-12 px-4 bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-lg shadow-sky-600/30 rounded-xl transition-all active:scale-[0.98] shrink-0 cursor-pointer select-none"
              title="Abrir filtros"
            >
              <span className="material-symbols-outlined text-xl">filter_list</span>
              <span className="tracking-wider text-xs uppercase font-extrabold">Filtros</span>
              {_osFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1 shadow-sm">
                  {_osFilterCount}
                </span>
              )}
            </button>
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

      {/* ── Sub-controls Bar: Year Selector and Current Sector indicator ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div ref={yearPickerRef} className="relative">
            <button
              type="button"
              aria-label={`Ano selecionado: ${selectedYear}. Clique para escolher outro ano`}
              aria-haspopup="dialog"
              aria-expanded={isYearPickerOpen}
              onClick={() => {
                setYearPickerDecade(Math.floor(selectedYear / 10) * 10);
                setIsYearPickerOpen(open => !open);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-sky-600 shadow-sm transition-colors hover:border-sky-400 dark:border-[#17233f] dark:bg-[#090f1d] dark:text-sky-400"
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              {selectedYear}
              <span className="material-symbols-outlined text-base">
                {isYearPickerOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {isYearPickerOpen && (
              <div
                role="dialog"
                aria-label="Selecionar ano"
                className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-[#1e2a44] dark:bg-[#090f1d]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    aria-label="Década anterior"
                    onClick={() => setYearPickerDecade(decade => decade - 10)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-[#131e38] dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined block text-lg">chevron_left</span>
                  </button>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {yearPickerDecade}–{yearPickerDecade + 9}
                  </span>
                  <button
                    type="button"
                    aria-label="Próxima década"
                    onClick={() => setYearPickerDecade(decade => decade + 10)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-[#131e38] dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined block text-lg">chevron_right</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 10 }, (_, index) => yearPickerDecade + index).map(year => (
                    <button
                      key={year}
                      type="button"
                      aria-pressed={selectedYear === year}
                      onClick={() => handleYearChange(year)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        selectedYear === year
                          ? 'bg-[#0284c7] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-[#131e38] dark:hover:text-sky-300'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Sector Legend */}
          {selectedSectors.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-[#17233f] dark:bg-[#090f1d]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Setores:</span>
              {selectedSectors.map(sector => (
                <span
                  key={sector.id}
                  className="inline-flex max-w-48 items-center gap-1.5 truncate font-bold text-slate-600 dark:text-slate-300"
                  title={sector.name}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getSectorDotColor(sector.id)}`} />
                  {sector.name}
                </span>
              ))}
            </div>
          )}
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
          <div
            className="flex-1 overflow-auto cursor-grab active:cursor-grabbing"
            onMouseDown={handleTableMouseDown}
            onClickCapture={handleTableClickCapture}
          >
            <table className="w-full border-collapse" style={{ minWidth: 1680 }}>
              <thead>
                {/* Row 1: Months / Quarters */}
                <tr className="bg-slate-100 dark:bg-[#070c18] border-b border-slate-200 dark:border-[#1e2a44] sticky top-0 z-20">
                  <th
                    ref={thRef}
                    rowSpan={2}
                    className="relative sticky left-0 z-30 bg-slate-100 dark:bg-[#070c18] text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-r-2 border-slate-300 dark:border-[#1e2a44] border-b-2 border-slate-300 dark:border-[#2b3d63] select-none whitespace-nowrap shadow-[inset_0_-2px_0_#cbd5e1] dark:shadow-[inset_0_-2px_0_#2b3d63]"
                    style={{ width: unitColWidth ?? autoUnitColWidth, minWidth: unitColWidth ?? autoUnitColWidth, maxWidth: unitColWidth ?? autoUnitColWidth }}
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

                  {MONTHS_SHORT.map((month, i) => {
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
                  })}
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
                        <span className="text-sm font-medium">Carregando Ordens de Serviço...</span>
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
                            ? 'Nenhuma Ordem de Serviço encontrada com os filtros selecionados.'
                            : 'Clique em FILTRAR para carregar as OSs.'}
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
        ref={tooltipRef}
        role="tooltip"
        className="pointer-events-none fixed max-h-[calc(100vh-16px)] w-[276px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900"
        style={{
          left: hoveredBar.left,
          top: hoveredBar.top,
          zIndex: 10000,
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
              OS {hoveredBar.bar.orderMask}
            </span>
            {(hoveredBar.bar.orderTypeCode || hoveredBar.bar.orderTypeSubCode) && (
              <span className="shrink-0 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {[hoveredBar.bar.orderTypeCode, hoveredBar.bar.orderTypeSubCode].filter(Boolean).join(' / ')}
              </span>
            )}
          </div>
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
            <dt className="shrink-0 text-slate-500 dark:text-slate-400">Setor/Posição</dt>
            <dd className="min-w-0 break-words text-right font-medium text-slate-700 dark:text-slate-200">
              {[hoveredBar.bar.sectorDescription, hoveredBar.bar.positionDescription].filter(Boolean).join(' / ') || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-slate-500 dark:text-slate-400">Autorizada</dt>
            <dd className="text-right font-medium text-slate-700 dark:text-slate-200">
              {hoveredBar.bar.authorizedAt ? formatGrantDate(hoveredBar.bar.authorizedAt) : '—'}
            </dd>
          </div>
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
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-slate-500 dark:text-slate-400">Causa</dt>
            <dd className="min-w-0 break-words text-right font-medium text-slate-700 dark:text-slate-200">
              {hoveredBar.bar.causeDescription || '—'}
            </dd>
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
    <span
      ref={unitMeasureRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 -z-[9999] invisible whitespace-nowrap px-4 font-bold text-xs tracking-wider"
    />
    </>
  );
};
