export type VehicleType = "Car" | "Motorcycle" | "Truck";

export interface Vehicle {
  id?: string;
  name: string;
  model: string;
  placa: string;
}

export interface FuelLog {
  id?: string;
  vehicleId: string;
  date: string; // ISO string YYYY-MM-DD
  mileage: number; // lillas actual
  kmActual: number; // Kilometraje actual/al momento del registro
  liters: number;
  totalCost: number;
  kmAnterior: number;
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
