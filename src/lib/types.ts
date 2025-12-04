export type Role = "driver" | "fleet_manager" | "admin";

export type VehicleStatus = "available" | "reserved" | "maintenance";

export interface Department {
  id: string;
  name: string;
  region?: string;
  color?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  departmentId: string;
}

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  model: string;
  year: number;
  departmentId: string;
  currentKm: number;
  ctDueDate: string;
  serviceDueKm: number;
  serviceDueDate: string;
  status: VehicleStatus;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  departmentId: string;
  startDateTime: string;
  endDateTime?: string;
  startKm: number;
  endKm?: number;
  fuelStartLevel: number;
  fuelEndLevel?: number;
  cleanlinessStart: "ok" | "to_clean" | "dirty";
  cleanlinessEnd?: "ok" | "to_clean" | "dirty";
  incidentNotes?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  departmentId: string;
  type: "ct" | "service" | "tires" | "repair" | "other";
  scheduledDate?: string;
  performedDate?: string;
  notes?: string;
  status: "planned" | "done";
}
