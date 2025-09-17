import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    return Response.json({
      data: session,
      error: null
    });
  } catch (error) {
    console.error('Error in get-session:', error);
    return Response.json({
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get session'
    }, { status: 500 });
  }
}