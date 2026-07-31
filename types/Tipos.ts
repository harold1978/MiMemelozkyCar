export type VehicleType = "Car" | "Motorcycle" | "Truck";

export interface Vehicle {
  id?: string;
  name: string;
  model: string;
  plate: string;
}

export interface FuelLog {
  id?: string;
  vehicleId: string;
  date: string; // ISO string YYYY-MM-DD
  mileage: number; // Kilometraje actual
  liters: number;
  totalCost: number;
}

export interface MaintenanceLog {
  id?: string;
  vehicleId: string;
  title: string;
  date: string;
  mileage: number; // Kilometraje actual/al momento del servicio
  cost: number;
  nextDueMileage?: number; // Próximo servicio (ej: 150000 km)
  status: "Pending" | "Completed";
}
