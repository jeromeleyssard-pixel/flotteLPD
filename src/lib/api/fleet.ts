import { supabase } from "@/lib/supabaseClient";
import type {
  Department,
  MaintenanceLog,
  Trip,
  User,
  Vehicle,
} from "@/lib/types";

export type FleetSnapshot = {
  departments: Department[];
  users: User[];
  vehicles: Vehicle[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
};

function mapDepartment(row: any): Department {
  return {
    id: row.id,
    name: row.name,
    region: row.region ?? undefined,
    color: row.color ?? undefined,
  };
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from("departments").select("*");
  
  if (error) {
    throw error;
  }
  
  return (data ?? []).map(mapDepartment);
}

function mapUser(row: any): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    departmentId: row.department_id ?? "",
  };
}

export function mapVehicle(row: any): Vehicle {
  return {
    id: row.id,
    name: row.name,
    licensePlate: row.license_plate,
    model: row.model,
    year: row.year ?? 0,
    departmentId: row.department_id,
    currentKm: row.current_km ?? 0,
    ctDueDate: row.ct_due_date ?? "",
    serviceDueKm: row.service_due_km ?? 0,
    serviceDueDate: row.service_due_date ?? "",
    status: row.status ?? "available",
  };
}

function mapTrip(row: any): Trip {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    driverId: row.driver_id,
    departmentId: row.department_id,
    startDateTime: row.start_datetime,
    endDateTime: row.end_datetime ?? undefined,
    startKm: row.start_km,
    endKm: row.end_km ?? undefined,
    fuelStartLevel: row.fuel_start_level ?? 3,
    fuelEndLevel: row.fuel_end_level ?? undefined,
    cleanlinessStart: row.cleanliness_start ?? "ok",
    cleanlinessEnd: row.cleanliness_end ?? undefined,
    incidentNotes: row.incident_notes ?? undefined,
  };
}

function mapMaintenance(row: any): MaintenanceLog {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    departmentId: row.department_id,
    type: row.type,
    scheduledDate: row.scheduled_date ?? undefined,
    performedDate: row.performed_date ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status ?? "planned",
  };
}

export async function fetchFleetSnapshot(): Promise<FleetSnapshot> {
  const [departmentsRes, usersRes, vehiclesRes, tripsRes, maintenanceRes] =
    await Promise.all([
      supabase.from("departments").select("*"),
      supabase.from("users").select("*"),
      supabase.from("vehicles").select("*"),
      supabase.from("trips").select("*"),
      supabase.from("maintenance_logs").select("*"),
    ]);

  const firstError =
    departmentsRes.error ||
    usersRes.error ||
    vehiclesRes.error ||
    tripsRes.error ||
    maintenanceRes.error;

  if (firstError) {
    throw firstError;
  }

  return {
    departments: (departmentsRes.data ?? []).map(mapDepartment),
    users: (usersRes.data ?? []).map(mapUser),
    vehicles: (vehiclesRes.data ?? []).map(mapVehicle),
    trips: (tripsRes.data ?? []).map(mapTrip),
    maintenance: (maintenanceRes.data ?? []).map(mapMaintenance),
  };
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    throw error;
  }
  return (data ?? []).map(mapUser);
}

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from("vehicles").select("*");
  if (error) {
    throw error;
  }
  return (data ?? []).map(mapVehicle);
}

export type CreateVehicleInput = {
  name: string;
  licensePlate: string;
  model: string;
  year?: number;
  departmentId: string;
  currentKm?: number;
  ctDueDate?: string;
  serviceDueKm?: number;
  serviceDueDate?: string;
  status?: Vehicle["status"];
};

function toVehicleRow(input: Partial<CreateVehicleInput>) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.licensePlate !== undefined && {
      license_plate: input.licensePlate,
    }),
    ...(input.model !== undefined && { model: input.model }),
    ...(input.year !== undefined && { year: input.year }),
    ...(input.departmentId !== undefined && { department_id: input.departmentId }),
    ...(input.currentKm !== undefined && { current_km: input.currentKm }),
    ...(input.ctDueDate !== undefined && { ct_due_date: input.ctDueDate }),
    ...(input.serviceDueKm !== undefined && {
      service_due_km: input.serviceDueKm,
    }),
    ...(input.serviceDueDate !== undefined && {
      service_due_date: input.serviceDueDate,
    }),
    ...(input.status !== undefined && { status: input.status }),
  };
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const { data, error } = await supabase
    .schema("fleet")
    .from("vehicles")
    .insert(toVehicleRow(input))
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Erreur de création : permissions insuffisantes ou erreur technique.");
  }

  return mapVehicle(data);
}

export type UpdateVehicleInput = {
  id: string;
} & Partial<CreateVehicleInput>;

export async function updateVehicle(
  input: UpdateVehicleInput,
): Promise<Vehicle> {
  const { id, ...fields } = input;
  const payload = toVehicleRow(fields);

  const { data, error } = await supabase
    .schema("fleet")
    .from("vehicles")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Mise à jour refusée : vous n'avez pas les droits ou le véhicule n'existe plus.");
  }

  return mapVehicle(data);
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .schema("fleet")
    .from("vehicles")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
