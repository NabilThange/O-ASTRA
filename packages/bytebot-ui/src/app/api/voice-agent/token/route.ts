import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AssemblyAI API key is missing" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      "https://agents.assemblyai.com/v1/token?expires_in_seconds=300&max_session_duration_seconds=8640",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[AssemblyAI Token] Error from upstream:", res.status, errorText);
      return NextResponse.json(
        { error: `Failed to mint token: ${res.statusText}`, details: errorText },
        { status: res.status }
      );
    }

    const data = (await res.json()) as { token: string };
    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error("[AssemblyAI Token] Request error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching AssemblyAI token" },
      { status: 500 }
    );
  }
}
