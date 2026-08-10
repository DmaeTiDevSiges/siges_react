export interface ManusService {
  UniqueId: string;
  ServiceId: string;
  Code: string;
  Description: string;
  Unit: string;
  Amount: number;
  Discount: number;
  PriceUnit: number;
  PriceTotal: number;
}

export interface ManusVehicle {
  UniqueId: string;
  VehicleId: string;
  Description: string;
  Amount: number;
  OperationUnit: string;
  Discount: number;
  PriceUnit: number;
  PriceTotal: number;
}

export interface ManusMaterial {
  UniqueId: string;
  MaterialId: string;
  Code: string;
  Description: string;
  Amount: number;
  Unit: string;
  Discount: number;
  PriceUnit: number;
  PriceTotal: number;
  Supplier: string; // "FERRAMENTAS GERAIS 25/09/25"
  SupplierInvoice: string; // "1010275"
}

export interface ManusImage {
  Url: string;
  Comments: string;
  CommentsCustomer: string;
  CustomerDoc?: string;
}

export interface ManusReport {
  UniqueId: string;
  AssetCode: string; // "0" or tag
  AssetDescription: string;
  Localization: string;
  Localization2: string;
  PlaceDescription: string;
  Place2Description: string;
  AssetStatus: string;
  AssetStatus2: string;
  AssetRecorder: number;
  AssetRecorder2: number;
  AssetPlaceChange: string;
  Actions: string;
  Comments: string;
  Materials: ManusMaterial[];
  Images: ManusImage[];
}

export interface ManusVisit {
  UniqueId: string;
  OrderMask: string; // 5110.1
  CustomerDoc: string; // 168.1.2025
  PlanCode: string; // 20.10.000006244-3
  OrderProgress: number;
  OrderVisitStartedDate: string; // 2025-09-25 14:06
  OrderVisitFinishedDate: string; // 2025-09-25 20:13
  OrderVisitLeaderNameShort: string;
  OrderVisitTeam: string;
  Comments: string;
  AssetDescription: string;
  AssetStarted: number;
  AssetEnded: number;
  AssetOperationUnit: string;
  Services: ManusService[];
  Vehicles: ManusVehicle[];
  Reports: ManusReport[];
  InvoiceServices: string;
  InvoiceServicesValue: number;
  InvoiceVehicles: string;
  InvoiceVehiclesValue: number;
  InvoiceMaterial: string;
  InvoiceMaterialValue: number;
  AgreeUserName: string;
  AgreeDate: string;
  ProcessStatus: string;
  
  // Custom frontend state
  _importStatus?: 'pending' | 'verifying' | 'ready' | 'importing' | 'success' | 'error';
  _importMessage?: string;
  _contractData?: any;
}
