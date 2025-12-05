"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createVehicle,
  deleteVehicle,
  fetchFleetSnapshot,
  updateVehicle,
} from "@/lib/api/fleet";
import type {
  Department,
  MaintenanceLog,
  Trip,
  User,
  Vehicle,
} from "@/lib/types";

const cleanlinessLabels = {
  ok: "Propre",
  to_clean: "À nettoyer",
  dirty: "Sale",
} as const;

const statusStyles: Record<Vehicle["status"], string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  maintenance: "bg-rose-50 text-rose-700 border-rose-200",
};

const maintenanceLabels = {
  ct: "Contrôle technique",
  service: "Entretien",
  tires: "Pneus",
  repair: "Réparation",
  other: "Autre",
};

type Cleanliness = Trip["cleanlinessStart"];

type CheckInForm = {
  vehicleId: string;
  startKm: string;
  fuelLevel: number;
  cleanliness: Cleanliness;
  notes: string;
};

type CheckOutForm = {
  tripId: string;
  endKm: string;
  fuelLevel: number;
  cleanliness: Cleanliness;
  notes: string;
  setToMaintenance: boolean;
};

type MaintenanceForm = {
  vehicleId: string;
  type: MaintenanceLog["type"];
  scheduledDate: string;
  notes: string;
};

type VehicleFormState = {
  id?: string;
  name: string;
  licensePlate: string;
  model: string;
  year: string;
  departmentId: string;
  currentKm: string;
  ctDueDate: string;
  serviceDueKm: string;
  serviceDueDate: string;
  status: Vehicle["status"];
};

type DashboardProps = {
  sessionUser?: User;
  onSessionUserChange: (user?: User) => void;
  onLogout: () => void;
  users: User[];
  welcomeInfo?: {
    firstName: string;
    lastName: string;
    departmentId: string;
  };
};

export default function Dashboard({
  sessionUser,
  onSessionUserChange,
  onLogout,
  users,
  welcomeInfo,
}: DashboardProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [departmentsState, setDepartmentsState] = useState<Department[]>([]);
  const [vehiclesState, setVehiclesState] = useState<Vehicle[]>([]);
  const [tripsState, setTripsState] = useState<Trip[]>([]);
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checkInForm, setCheckInForm] = useState<CheckInForm>({
    vehicleId: "",
    startKm: "",
    fuelLevel: 3,
    cleanliness: "ok",
    notes: "",
  });
  const [checkOutForm, setCheckOutForm] = useState<CheckOutForm>({
    tripId: "",
    endKm: "",
    fuelLevel: 3,
    cleanliness: "ok",
    notes: "",
    setToMaintenance: false,
  });
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>({
    vehicleId: "",
    type: "service",
    scheduledDate: "",
    notes: "",
  });
  const emptyVehicleForm: VehicleFormState = {
    id: undefined,
    name: "",
    licensePlate: "",
    model: "",
    year: "",
    departmentId: sessionUser?.departmentId ?? welcomeInfo?.departmentId ?? "",
    currentKm: "",
    ctDueDate: "",
    serviceDueKm: "",
    serviceDueDate: "",
    status: "available",
  };
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(emptyVehicleForm);
  const [vehicleFormMode, setVehicleFormMode] = useState<"create" | "edit">("create");
  const [vehicleFormSubmitting, setVehicleFormSubmitting] = useState(false);
  const [vehicleFormError, setVehicleFormError] = useState<string | null>(null);
  const [bookingVehicleId, setBookingVehicleId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isVehicleManagementOpen, setIsVehicleManagementOpen] = useState(false);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchFleetSnapshot();
      setDepartmentsState(snapshot.departments);
      setVehiclesState(snapshot.vehicles);
      setTripsState(snapshot.trips);
      setMaintenanceState(snapshot.maintenance);
    } catch (loadError) {
      setError("Impossible de charger les données flotte. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleVehicleBookingToggle(vehicle: Vehicle) {
    if (vehicle.status === "maintenance") return;
    setBookingVehicleId(vehicle.id);
    setBookingError(null);
    try {
      const nextStatus = vehicle.status === "available" ? "reserved" : "available";
      const updated = await updateVehicle({ id: vehicle.id, status: nextStatus });
      setVehiclesState((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (error) {
      setBookingError("Impossible de mettre à jour la réservation pour le moment.");
    } finally {
      setBookingVehicleId(null);
    }
  }

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    setSelectedDepartment("all");
  }, [sessionUser]);

  const filteredVehicles = useMemo(() => {
    if (selectedDepartment === "all") return vehiclesState;
    return vehiclesState.filter(
      (vehicle) => vehicle.departmentId === selectedDepartment,
    );
  }, [vehiclesState, selectedDepartment]);

  const filteredMaintenance = useMemo(() => {
    if (selectedDepartment === "all") return maintenanceState;
    return maintenanceState.filter(
      (entry) => entry.departmentId === selectedDepartment,
    );
  }, [maintenanceState, selectedDepartment]);

  const filteredTrips = useMemo(() => {
    if (selectedDepartment === "all") return tripsState;
    return tripsState.filter((trip) => trip.departmentId === selectedDepartment);
  }, [tripsState, selectedDepartment]);

  const availableVehicles = filteredVehicles.filter(
    (vehicle) => vehicle.status === "available",
  );
  const openTrips = filteredTrips.filter((trip) => !trip.endDateTime);
  const selectableTrips = openTrips;

  const stats = useMemo(() => {
    const totalVehicles = filteredVehicles.length;
    const reserved = filteredVehicles.filter((v) => v.status === "reserved");
    const maintenance = filteredVehicles.filter(
      (v) => v.status === "maintenance",
    );
    const ctAlerts = filteredVehicles.filter((v) => {
      const due = new Date(v.ctDueDate).getTime();
      const warningDate = Date.now() + 1000 * 60 * 60 * 24 * 30;
      return due <= warningDate;
    });
    return {
      totalVehicles,
      available: totalVehicles - reserved.length - maintenance.length,
      reserved: reserved.length,
      maintenance: maintenance.length,
      ctAlerts: ctAlerts.length,
    };
  }, [vehiclesState]);

  function resetVehicleForm() {
    setVehicleForm({
      ...emptyVehicleForm,
      departmentId: sessionUser?.departmentId ?? welcomeInfo?.departmentId ?? "",
    });
    setVehicleFormMode("create");
    setVehicleFormError(null);
  }

  function formatDate(dateString?: string) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  }

  function fillVehicleForm(vehicle: Vehicle) {
    setVehicleForm({
      id: vehicle.id,
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      model: vehicle.model,
      year: vehicle.year ? String(vehicle.year) : "",
      departmentId: vehicle.departmentId,
      currentKm: vehicle.currentKm ? String(vehicle.currentKm) : "",
      ctDueDate: vehicle.ctDueDate ?? "",
      serviceDueKm: vehicle.serviceDueKm ? String(vehicle.serviceDueKm) : "",
      serviceDueDate: vehicle.serviceDueDate ?? "",
      status: vehicle.status,
    });
    setVehicleFormMode("edit");
    setVehicleFormError(null);
  }

  function parseVehiclePayload(form: VehicleFormState) {
    return {
      name: form.name.trim(),
      licensePlate: form.licensePlate.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : undefined,
      departmentId: form.departmentId,
      currentKm: form.currentKm ? Number(form.currentKm) : undefined,
      ctDueDate: form.ctDueDate || undefined,
      serviceDueKm: form.serviceDueKm ? Number(form.serviceDueKm) : undefined,
      serviceDueDate: form.serviceDueDate || undefined,
      status: form.status,
    };
  }

  async function handleVehicleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVehicleFormSubmitting(true);
    setVehicleFormError(null);
    try {
      const payload = parseVehiclePayload(vehicleForm);
      let saved: Vehicle;
      if (vehicleFormMode === "edit" && vehicleForm.id) {
        saved = await updateVehicle({ id: vehicleForm.id, ...payload });
        setVehiclesState((prev) =>
          prev.map((vehicle) => (vehicle.id === saved.id ? saved : vehicle)),
        );
      } else {
        saved = await createVehicle(payload);
        setVehiclesState((prev) => [saved, ...prev]);
      }
      resetVehicleForm();
    } catch (saveError) {
      setVehicleFormError(
        "Impossible d'enregistrer le véhicule. Vérifie les champs et réessaie.",
      );
    } finally {
      setVehicleFormSubmitting(false);
    }
  }

  async function handleVehicleDelete(id: string) {
    const vehicle = vehiclesState.find((v) => v.id === id);
    if (!vehicle) return;
    const confirmed = window.confirm(
      `Supprimer ${vehicle.name} (${vehicle.licensePlate}) ?`,
    );
    if (!confirmed) return;
    try {
      await deleteVehicle(id);
      setVehiclesState((prev) => prev.filter((v) => v.id !== id));
      if (vehicleFormMode === "edit" && vehicleForm.id === id) {
        resetVehicleForm();
      }
    } catch (deleteError) {
      setVehicleFormError(
        "Suppression impossible pour le moment. Réessaie plus tard.",
      );
    }
  }

  function handleStartTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const vehicle = vehiclesState.find((v) => v.id === checkInForm.vehicleId);
    if (!vehicle) return;

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      vehicleId: vehicle.id,
      driverId: sessionUser?.id || users[0]?.id || "unknown",
      departmentId: vehicle.departmentId,
      startDateTime: new Date().toISOString(),
      startKm: Number(checkInForm.startKm || vehicle.currentKm),
      fuelStartLevel: checkInForm.fuelLevel,
      cleanlinessStart: checkInForm.cleanliness,
      incidentNotes: checkInForm.notes,
    };

    setTripsState((prev) => [newTrip, ...prev]);
    setVehiclesState((prev) =>
      prev.map((v) =>
        v.id === vehicle.id
          ? {
              ...v,
              status: "reserved",
              currentKm: newTrip.startKm,
            }
          : v,
      ),
    );
    setCheckInForm({ vehicleId: "", startKm: "", fuelLevel: 3, cleanliness: "ok", notes: "" });
  }

  function handleCloseTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trip = tripsState.find((t) => t.id === checkOutForm.tripId);
    if (!trip) return;

    const vehicle = vehiclesState.find((v) => v.id === trip.vehicleId);
    if (!vehicle) return;

    const updatedTrip: Trip = {
      ...trip,
      endDateTime: new Date().toISOString(),
      endKm: Number(checkOutForm.endKm || trip.startKm),
      fuelEndLevel: checkOutForm.fuelLevel,
      cleanlinessEnd: checkOutForm.cleanliness,
      incidentNotes: checkOutForm.notes || trip.incidentNotes,
    };

    setTripsState((prev) => prev.map((t) => (t.id === trip.id ? updatedTrip : t)));
    setVehiclesState((prev) =>
      prev.map((v) =>
        v.id === vehicle.id
          ? {
              ...v,
              status: checkOutForm.setToMaintenance ? "maintenance" : "available",
              currentKm: updatedTrip.endKm ?? v.currentKm,
            }
          : v,
      ),
    );
    setCheckOutForm({ tripId: "", endKm: "", fuelLevel: 3, cleanliness: "ok", notes: "", setToMaintenance: false });
  }

  function handleMaintenanceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!maintenanceForm.vehicleId) return;
    const vehicle = vehiclesState.find((v) => v.id === maintenanceForm.vehicleId);
    if (!vehicle) return;
    const newEntry: MaintenanceLog = {
      id: `mnt-${Date.now()}`,
      departmentId:
        selectedDepartment === "all"
          ? vehicle.departmentId
          : selectedDepartment,
      vehicleId: maintenanceForm.vehicleId,
      type: maintenanceForm.type,
      scheduledDate: maintenanceForm.scheduledDate,
      notes: maintenanceForm.notes,
      status: "planned",
    };
    setMaintenanceState((prev) => [newEntry, ...prev]);
    setVehiclesState((prev) =>
      prev.map((v) =>
        v.id === maintenanceForm.vehicleId && v.status === "available"
          ? { ...v, status: "maintenance" }
          : v,
      ),
    );
    setMaintenanceForm({ vehicleId: "", type: "service", scheduledDate: "", notes: "" });
  }

  function getVehicleLabel(id: string) {
    return vehiclesState.find((v) => v.id === id)?.name ?? "Véhicule";
  }

  function getDriverLabel(id: string) {
    return users.find((user) => user.id === id)?.fullName ?? id;
  }

  function getDepartmentName(id: string) {
    if (id === "all") return "Tous";
    return departmentsState.find((dept) => dept.id === id)?.name ?? id;
  }

  const recentTrips = useMemo(
    () =>
      [...filteredTrips]
        .filter((trip) => trip.endDateTime)
        .sort((a, b) =>
          (b.endDateTime ?? "").localeCompare(a.endDateTime ?? ""),
        )
        .slice(0, 5),
    [filteredTrips],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Chargement des données flotte…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
          <p className="mb-4 text-sm text-rose-600">{error}</p>
          <button
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={loadSnapshot}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <SessionBar
          sessionUser={sessionUser}
          welcomeInfo={welcomeInfo}
          onUserChange={onSessionUserChange}
          onLogout={onLogout}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          departments={departmentsState}
          users={users}
        />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Véhicules" value={stats.totalVehicles} sub="totaux" />
          <StatCard label="Disponibles" value={stats.available} sub="prêts à partir" accent="text-emerald-600" />
          <StatCard label="Réservés" value={stats.reserved} sub="en sortie" accent="text-amber-600" />
          <StatCard label="Alertes CT" value={stats.ctAlerts} sub="< 30 jours" accent="text-rose-600" />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-4">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Véhicules du département</h2>
                  <p className="text-sm text-slate-500">
                    Vue filtrée par {selectedDepartment === "all" ? "tous les départements" : getDepartmentName(selectedDepartment)}.
                  </p>
                </div>
                <span className="text-sm font-medium text-slate-500">
                  {filteredVehicles.length} véhicules
                </span>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    statusClass={statusStyles[vehicle.status]}
                    formatDate={formatDate}
                    canQuickBook
                    bookingBusy={bookingVehicleId === vehicle.id}
                    onToggleBooking={() => handleVehicleBookingToggle(vehicle)}
                  />
                ))}
              </div>
              {bookingError && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {bookingError}
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Actions rapides</h2>
            <div className="flex flex-col gap-6">
              <form className="space-y-3" onSubmit={handleStartTrip}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Prendre un véhicule</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {availableVehicles.length} dispo
                  </span>
                </div>
                <select
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={checkInForm.vehicleId}
                  onChange={(event) =>
                    setCheckInForm((prev) => ({ ...prev, vehicleId: event.target.value }))
                  }
                >
                  <option value="">Sélectionner</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Km départ"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={checkInForm.startKm}
                  onChange={(event) =>
                    setCheckInForm((prev) => ({ ...prev, startKm: event.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <label className="flex w-1/2 flex-col text-xs text-slate-500">
                    Carburant
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={checkInForm.fuelLevel}
                      onChange={(event) =>
                        setCheckInForm((prev) => ({ ...prev, fuelLevel: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <select
                    className="w-1/2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={checkInForm.cleanliness}
                    onChange={(event) =>
                      setCheckInForm((prev) => ({ ...prev, cleanliness: event.target.value as Cleanliness }))
                    }
                  >
                    {Object.entries(cleanlinessLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Remarques"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                  value={checkInForm.notes}
                  onChange={(event) =>
                    setCheckInForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white"
                >
                  Lancer le trajet
                </button>
              </form>

              <form className="space-y-3" onSubmit={handleCloseTrip}>
                <p className="text-sm font-semibold text-slate-700">Clôturer un trajet</p>
                <select
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={checkOutForm.tripId}
                  onChange={(event) =>
                    setCheckOutForm((prev) => ({ ...prev, tripId: event.target.value }))
                  }
                >
                  <option value="">Sélectionner</option>
                  {selectableTrips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {getVehicleLabel(trip.vehicleId)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Km retour"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={checkOutForm.endKm}
                  onChange={(event) =>
                    setCheckOutForm((prev) => ({ ...prev, endKm: event.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <label className="flex w-1/2 flex-col text-xs text-slate-500">
                    Carburant
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={checkOutForm.fuelLevel}
                      onChange={(event) =>
                        setCheckOutForm((prev) => ({ ...prev, fuelLevel: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <select
                    className="w-1/2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={checkOutForm.cleanliness}
                    onChange={(event) =>
                      setCheckOutForm((prev) => ({ ...prev, cleanliness: event.target.value as Cleanliness }))
                    }
                  >
                    {Object.entries(cleanlinessLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Incidents / remarques"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                  value={checkOutForm.notes}
                  onChange={(event) =>
                    setCheckOutForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={checkOutForm.setToMaintenance}
                    onChange={(event) =>
                      setCheckOutForm((prev) => ({ ...prev, setToMaintenance: event.target.checked }))
                    }
                  />
                  Signaler un souci majeur
                </label>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white"
                >
                  Terminer le trajet
                </button>
              </form>
            </div>
          </article>
        </section>

        {/* Gestion des véhicules - Accordéon */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-2xl cursor-pointer"
            onClick={() => setIsVehicleManagementOpen(!isVehicleManagementOpen)}
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Gestion des véhicules</h2>
              <p className="text-sm text-slate-500">Ajoutez, modifiez ou supprimez des véhicules</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-sm font-semibold text-emerald-600"
                onClick={(e) => {
                  e.stopPropagation();
                  resetVehicleForm();
                  setIsVehicleManagementOpen(true);
                }}
              >
                + Nouveau véhicule
              </button>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${isVehicleManagementOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {isVehicleManagementOpen && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <form className="grid gap-3 md:grid-cols-2 mt-4" onSubmit={handleVehicleSubmit}>
                <input
                  required
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Nom"
                  value={vehicleForm.name}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <input
                  required
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Immatriculation"
                  value={vehicleForm.licensePlate}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      licensePlate: event.target.value,
                    }))
                  }
                />
                <input
                  required
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Modèle"
                  value={vehicleForm.model}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({ ...prev, model: event.target.value }))
                  }
                />
                <input
                  type="number"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Année (ex: 2022)"
                  value={vehicleForm.year}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({ ...prev, year: event.target.value }))
                  }
                />
                <select
                  required
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={vehicleForm.departmentId}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      departmentId: event.target.value,
                    }))
                  }
                >
                  <option value="">Département assigné</option>
                  {departmentsState.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Kilométrage actuel"
                  value={vehicleForm.currentKm}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({ ...prev, currentKm: event.target.value }))
                  }
                />
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Prochain CT"
                  value={vehicleForm.ctDueDate}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({ ...prev, ctDueDate: event.target.value }))
                  }
                />
                <input
                  type="number"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Entretien à (km)"
                  value={vehicleForm.serviceDueKm}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      serviceDueKm: event.target.value,
                    }))
                  }
                />
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Date entretien"
                  value={vehicleForm.serviceDueDate}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      serviceDueDate: event.target.value,
                    }))
                  }
                />
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={vehicleForm.status}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      status: event.target.value as Vehicle["status"],
                    }))
                  }
                >
                  <option value="available">Disponible</option>
                  <option value="reserved">Réservé</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={vehicleFormSubmitting}
                  >
                    {vehicleFormMode === "edit" ? "Mettre à jour" : "Créer"}
                  </button>
                  {vehicleFormMode === "edit" && vehicleForm.id && (
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      onClick={() => handleVehicleDelete(vehicleForm.id!)}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                {vehicleFormError && (
                  <p className="col-span-full rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {vehicleFormError}
                  </p>
                )}
              </form>

              <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Nom</th>
                      <th className="px-3 py-2">Plaque</th>
                      <th className="px-3 py-2">Département</th>
                      <th className="px-3 py-2">Statut</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehiclesState.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {vehicle.name}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {vehicle.licensePlate}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {getDepartmentName(vehicle.departmentId)}
                        </td>
                        <td className="px-3 py-2 text-slate-500 capitalize">
                          {vehicle.status === "available"
                            ? "Disponible"
                            : vehicle.status === "reserved"
                            ? "Réservé"
                            : "Maintenance"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            className="text-sm font-semibold text-slate-600 underline"
                            onClick={() => fillVehicleForm(vehicle)}
                          >
                            Éditer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Maintenance & alertes</h2>
                <p className="text-sm text-slate-500">Préparez CT, vidanges et réparations.</p>
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                {filteredMaintenance.length} interventions
              </span>
            </header>
            <ul className="space-y-3">
              {filteredMaintenance.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {maintenanceLabels[entry.type]} · {getVehicleLabel(entry.vehicleId)}
                      </p>
                      <p className="text-xs text-slate-500">{entry.notes || "Pas de commentaire"}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{formatDate(entry.scheduledDate || entry.performedDate)}</p>
                      <p className="uppercase tracking-wide">
                        {entry.status === "planned" ? "Planifié" : "Réalisé"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <form className="mt-4 space-y-3" onSubmit={handleMaintenanceSubmit}>
              <select
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={maintenanceForm.vehicleId}
                onChange={(event) =>
                  setMaintenanceForm((prev) => ({ ...prev, vehicleId: event.target.value }))
                }
              >
                <option value="">Véhicule concerné</option>
                {vehiclesState.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  className="w-1/2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={maintenanceForm.type}
                  onChange={(event) =>
                    setMaintenanceForm((prev) => ({ ...prev, type: event.target.value as MaintenanceLog["type"] }))
                  }
                >
                  {Object.entries(maintenanceLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="w-1/2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={maintenanceForm.scheduledDate}
                  onChange={(event) =>
                    setMaintenanceForm((prev) => ({ ...prev, scheduledDate: event.target.value }))
                  }
                />
              </div>
              <textarea
                placeholder="Notes"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={2}
                value={maintenanceForm.notes}
                onChange={(event) =>
                  setMaintenanceForm((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
              <button
                type="submit"
                className="w-full rounded-xl border border-slate-900 bg-white py-2 text-sm font-semibold text-slate-900"
              >
                Ajouter une intervention
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Historique des trajets</h2>
                <p className="text-sm text-slate-500">5 derniers trajets validés.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {recentTrips.length}
              </span>
            </header>
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Véhicule</th>
                    <th className="px-3 py-2">Conducteur</th>
                    <th className="px-3 py-2">Km</th>
                    <th className="px-3 py-2">Retour</th>
                    <th className="px-3 py-2">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTrips.map((trip) => (
                    <tr key={trip.id} className="bg-white">
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {getVehicleLabel(trip.vehicleId)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{getDriverLabel(trip.driverId)}</td>
                      <td className="px-3 py-2 text-slate-500">
                        {trip.startKm} → {trip.endKm ?? "?"}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{formatDate(trip.endDateTime)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {cleanlinessLabels[trip.cleanlinessEnd ?? trip.cleanlinessStart]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

function SessionBar({
  sessionUser,
  welcomeInfo,
  onUserChange,
  onLogout,
  selectedDepartment,
  onDepartmentChange,
  departments,
  users,
}: {
  sessionUser?: User;
  welcomeInfo?: {
    firstName: string;
    lastName: string;
    departmentId: string;
  };
  onUserChange: (user?: User) => void;
  onLogout: () => void;
  selectedDepartment: string;
  onDepartmentChange: (deptId: string) => void;
  departments: Department[];
  users: User[];
}) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <img 
          src="/logo-petits-debrouillards.jpg" 
          alt="Les Petits Débrouillards" 
          className="h-12 w-auto object-contain"
        />
        <div>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Bonjour {welcomeInfo?.firstName || "Utilisateur"},
          </h1>
          <p className="text-sm text-slate-600">
            Département : {departments.find(d => d.id === welcomeInfo?.departmentId)?.name || "Non spécifié"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Département
          <select
            className="mt-1 min-w-[200px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={selectedDepartment}
            onChange={(event) => onDepartmentChange(event.target.value)}
          >
            <option value="all">Tous les départements</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400"
        >
          Se déconnecter
        </button>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = "text-slate-900",
}: {
  label: string;
  value: number;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="text-sm text-slate-500">{sub}</p>
    </div>
  );
}

function VehicleCard({
  vehicle,
  statusClass,
  formatDate,
  canQuickBook = false,
  bookingBusy = false,
  onToggleBooking,
}: {
  vehicle: Vehicle;
  statusClass: string;
  formatDate: (value?: string) => string;
  canQuickBook?: boolean;
  bookingBusy?: boolean;
  onToggleBooking?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{vehicle.name}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {vehicle.licensePlate} · {vehicle.model}
          </p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass}`}>
          {vehicle.status === "available"
            ? "Disponible"
            : vehicle.status === "reserved"
            ? "Réservé"
            : "Maintenance"}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div>
          <dt className="text-xs uppercase text-slate-400">Km actuels</dt>
          <dd className="font-semibold text-slate-900">{vehicle.currentKm.toLocaleString("fr-FR")} km</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-400">CT</dt>
          <dd>{formatDate(vehicle.ctDueDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-400">Entretien</dt>
          <dd>{formatDate(vehicle.serviceDueDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-400">Seuil km</dt>
          <dd>{vehicle.serviceDueKm.toLocaleString("fr-FR")} km</dd>
        </div>
      </dl>
      {canQuickBook && (
        <button
          type="button"
          disabled={vehicle.status === "maintenance" || bookingBusy}
          onClick={onToggleBooking}
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {bookingBusy
            ? "Mise à jour…"
            : vehicle.status === "available"
            ? "Réserver"
            : "Libérer"}
        </button>
      )}
    </div>
  );
}
