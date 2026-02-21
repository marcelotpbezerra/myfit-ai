import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exerciseId");

    if (!exerciseId) {
        return new NextResponse("Missing exerciseId", { status: 400 });
    }

    const rapidKey = process.env.X_RAPIDAPI_KEY;
    if (!rapidKey) {
        return new NextResponse("Service Configuration Error", { status: 500 });
    }

    try {
        const response = await fetch(
            `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=360`,
            {
                method: "GET",
                headers: {
                    "X-RapidAPI-Key": rapidKey,
                    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com"
                }
            }
        );

        if (!response.ok) {
            console.error(`[Proxy Image ERROR] ExerciseDB ID ${exerciseId} status: ${response.status}`);
            return new NextResponse("Failed to fetch image", { status: response.status });
        }

        const data = await response.arrayBuffer();

        return new NextResponse(data, {
            headers: {
                "Content-Type": "image/gif",
                "Cache-Control": "public, max-age=43200, s-maxage=43200", // Caching for 12 hours
            },
        });
    } catch (error) {
        console.error(`[Proxy Image CRITICAL] ID ${exerciseId}:`, error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
