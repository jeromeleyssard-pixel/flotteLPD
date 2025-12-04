import { Department, MaintenanceLog, Trip, User, Vehicle } from "./types";

export const departments: Department[] = [
  { id: "dept-vaucluse", name: "Vaucluse", region: "PACA", color: "#2563eb" },
  { id: "dept-bdr", name: "Bouches-du-Rhône", region: "PACA", color: "#16a34a" },
];

export const currentUser: User = {
  id: "user-marie",
  fullName: "Marie Coordan",
  email: "marie@petitsdebrouillards.org",
  role: "fleet_manager",
  departmentId: "dept-vaucluse",
};

export const users: User[] = [
  currentUser,
  {
    id: "user-amin",
    fullName: "Amin Vacataire",
    email: "amin@example.org",
    role: "driver",
    departmentId: "dept-vaucluse",
  },
  {
    id: "user-sarah",
    fullName: "Sarah Admin",
    email: "sarah@example.org",
    role: "admin",
    departmentId: "dept-bdr",
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "veh-dokker",
    name: "Dokker blanc",
    licensePlate: "AB-123-CD",
    model: "Dacia Dokker",
    year: 2018,
    departmentId: "dept-vaucluse",
    currentKm: 128540,
    ctDueDate: "2025-03-12",
    serviceDueKm: 130000,
    serviceDueDate: "2025-02-01",
    status: "available",
  },
  {
    id: "veh-logan",
    name: "Logan bleue",
    licensePlate: "EF-456-GH",
    model: "Dacia Logan",
    year: 2017,
    departmentId: "dept-vaucluse",
    currentKm: 164200,
    ctDueDate: "2024-12-01",
    serviceDueKm: 165000,
    serviceDueDate: "2024-12-15",
    status: "reserved",
  },
  {
    id: "veh-transit",
    name: "Ford Transit",
    licensePlate: "IJ-789-KL",
    model: "Ford Transit",
    year: 2020,
    departmentId: "dept-vaucluse",
    currentKm: 95200,
    ctDueDate: "2025-06-18",
    serviceDueKm: 100000,
    serviceDueDate: "2025-05-10",
    status: "maintenance",
  },
  {
    id: "veh-kangoo",
    name: "Kangoo jaune",
    licensePlate: "MN-321-OP",
    model: "Renault Kangoo",
    year: 2019,
    departmentId: "dept-bdr",
    currentKm: 88400,
    ctDueDate: "2025-08-09",
    serviceDueKm: 95000,
    serviceDueDate: "2025-07-01",
    status: "available",
  },
];

export const trips: Trip[] = [
  {
    id: "trip-001",
    vehicleId: "veh-logan",
    driverId: "user-amin",
    departmentId: "dept-vaucluse",
    startDateTime: "2024-12-03T08:30:00Z",
    endDateTime: "2024-12-03T17:00:00Z",
    startKm: 164000,
    endKm: 164200,
    fuelStartLevel: 4,
    fuelEndLevel: 3,
    cleanlinessStart: "ok",
    cleanlinessEnd: "to_clean",
    incidentNotes: "Trace de boue sur sièges arrière",
  },
  {
    id: "trip-002",
    vehicleId: "veh-dokker",
    driverId: "user-marie",
    departmentId: "dept-vaucluse",
    startDateTime: "2024-12-04T07:45:00Z",
    startKm: 128540,
    fuelStartLevel: 3,
    cleanlinessStart: "ok",
  },
];

export const maintenanceLogs: MaintenanceLog[] = [
  {
    id: "mnt-001",
    vehicleId: "veh-transit",
    departmentId: "dept-vaucluse",
    type: "service",
    scheduledDate: "2024-12-10",
    status: "planned",
    notes: "Vérifier freinage + vidange",
  },
  {
    id: "mnt-002",
    vehicleId: "veh-logan",
    departmentId: "dept-vaucluse",
    type: "ct",
    scheduledDate: "2024-12-15",
    status: "planned",
  },
  {
    id: "mnt-003",
    vehicleId: "veh-kangoo",
    departmentId: "dept-bdr",
    type: "tires",
    performedDate: "2024-11-20",
    status: "done",
  },
];

export function getDepartmentVehicles(departmentId: string) {
  return vehicles.filter((vehicle) => vehicle.departmentId === departmentId);
}

export function getDepartmentTrips(departmentId: string) {
  return trips.filter((trip) => trip.departmentId === departmentId);
}

export function getOpenTripsForDriver(driverId: string) {
  return trips.filter((trip) => trip.driverId === driverId && !trip.endDateTime);
}

export function getMaintenanceByDepartment(departmentId: string) {
  return maintenanceLogs.filter((entry) => entry.departmentId === departmentId);
}
