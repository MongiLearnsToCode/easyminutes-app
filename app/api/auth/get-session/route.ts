import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    console.log('GET /api/auth/get-session called');
    const session = await auth.api.getSession({
      headers: await headers()
    });

    console.log('Session result:', session ? 'found' : 'not found');

    return Response.json({
      data: session,
      error: null
    });
  } catch (error) {
    console.error('Error in get-session:', error);
    return Response.json({
      data: null,
      error: 'Failed to get session'
    }, { status: 500 });
  }
}