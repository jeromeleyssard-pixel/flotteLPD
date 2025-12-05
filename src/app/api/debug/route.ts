import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // Diagnostic des variables d'environnement
    const diagnostics: any = {
      env_vars: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
        service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",
      },
      supabase_test: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        client_created: "✅ Yes",
      },
      connection_test: null, // Will be populated below
    };

    // Test de connexion simple
    try {
      const { data, error } = await supabase.from("departments").select("count", { count: "exact", head: true });
      
      diagnostics.connection_test = {
        success: !error,
        count: data,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details,
        } : null,
      };
    } catch (connError) {
      diagnostics.connection_test = {
        success: false,
        error: {
          message: connError instanceof Error ? connError.message : "Unknown error",
          type: "connection_error",
        },
      };
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
