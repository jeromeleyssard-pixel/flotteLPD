import { NextResponse } from "next/server";

export async function GET() {
  // Endpoint temporaire pour tester sans dépendre Supabase
  const mockDepartments = [
    { id: "dept-01", name: "Département 1" },
    { id: "dept-02", name: "Département 2" },
    { id: "dept-03", name: "Département 3" },
  ];

  return NextResponse.json({
    success: true,
    departments: mockDepartments,
    message: "Données de test - CORS Supabase en cours de configuration"
  });
}
