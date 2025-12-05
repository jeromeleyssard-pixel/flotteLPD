"use client";

import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import { useSession } from "@/context/SessionContext";
import type { Department, User } from "@/lib/types";
import { fetchDepartments } from "@/lib/api/fleet";

export default function DashboardRoot() {
  const {
    sessionUser,
    setSessionUser,
    hasAcknowledgedSafety,
    acknowledgeSafety,
    users,
    usersLoading,
    welcomeInfo,
    setWelcomeInfo,
  } = useSession();

  // Si aucune information d'accueil n'est enregistrée, afficher le formulaire
  if (!welcomeInfo) {
    return <WelcomeForm onSubmit={setWelcomeInfo} />;
  }

  // Si aucun utilisateur n'est sélectionné, afficher la sélection simple
  if (!sessionUser) {
    return (
      <AuthGate
        onSelectUser={setSessionUser}
        users={users}
        loading={usersLoading}
      />
    );
  }

  if (!hasAcknowledgedSafety) {
    return (
      <SafetyReminder
        userName={`${welcomeInfo.firstName} ${welcomeInfo.lastName}`}
        onAcknowledge={acknowledgeSafety}
        onLogout={() => setWelcomeInfo(undefined)}
      />
    );
  }

  return (
    <Dashboard
      sessionUser={sessionUser}
      onSessionUserChange={(user) => {
        setSessionUser(user);
      }}
      users={users}
      onLogout={() => setWelcomeInfo(undefined)}
      welcomeInfo={welcomeInfo}
    />
  );
}

function SafetyReminder({
  userName,
  onAcknowledge,
  onLogout,
}: {
  userName: string;
  onAcknowledge: () => void;
  onLogout: () => void;
}) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-rose-200 bg-white p-8 text-slate-900 shadow-2xl">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
            Prévention sécurité routière
          </p>
          <h2 className="text-2xl font-semibold">
            Bonjour {userName.split(" ")[0]}, merci de valider les règles avant de prendre la route
          </h2>
        </header>
        <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
          <li>Respect strict du Code de la route, limitations de vitesse et zones piétonnes.</li>
          <li>Interdiction de conduire après consommation d’alcool, stupéfiants ou médicaments incompatibles.</li>
          <li>Port de la ceinture obligatoire pour tous les passagers, arrêts réguliers en cas de fatigue.</li>
          <li>Signalement immédiat de toute infraction, amende ou accident au coordinateur départemental.</li>
          <li>Responsabilité financière partagée pour les amendes liées à une négligence avérée.</li>
          <li>Vérification visuelle du véhicule (pneus, feux, propreté) avant chaque départ.</li>
        </ul>
        <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={isChecked}
            onChange={(event) => setIsChecked(event.target.checked)}
          />
          <span>
            Je reconnais avoir pris connaissance des obligations de conduite et j’accepte que l’association conserve les preuves de ma lecture en cas d’infraction.
          </span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onLogout}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Changer d’utilisateur
          </button>
          <button
            disabled={!isChecked}
            onClick={onAcknowledge}
            className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Valider et continuer
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeForm({
  onSubmit,
}: {
  onSubmit: (info: { firstName: string; lastName: string; departmentId: string }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  // Récupérer les départements depuis Supabase au chargement
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const departmentsData = await fetchDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        // En cas d'erreur, continuer sans départements plutôt qu'avec des IDs fictifs
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    loadDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !departmentId) return;

    setLoading(true);
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      departmentId,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <header className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Bienvenue dans la flotte
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Configurez votre profil
          </h1>
          <p className="text-sm text-slate-500">
            Entrez vos informations pour accéder à l'application.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prénom
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jean"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Dupont"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Département
            </label>
            <select
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={departmentsLoading}
            >
              <option value="">
                {departmentsLoading ? "Chargement..." : "Sélectionner un département"}
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !firstName.trim() || !lastName.trim() || !departmentId}
            className="w-full rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading ? "Chargement..." : "Continuer"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AuthGate({
  onSelectUser,
  users,
  loading,
}: {
  onSelectUser: (user: (typeof users)[number]) => void;
  users: any[];
  loading: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <header className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Accès sécurisé flotte véhicules
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Connecte-toi pour gérer ta flotte
          </h1>
          <p className="text-sm text-slate-500">
            Sélectionnez votre profil pour accéder à l'application.
          </p>
        </header>
        {loading ? (
          <p className="text-center text-sm text-slate-500">
            Chargement des profils utilisateurs…
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-400"
              >
                <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{user.email}</p>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
