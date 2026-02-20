import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { seedExercises, seedDietPlan } from "@/actions/sync";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const exercisesResult = await seedExercises();
        const dietResult = await seedDietPlan();

        return NextResponse.json({
            success: true,
            results: {
                exercises: exercisesResult,
                diet: dietResult
            }
        });
    } catch (error: any) {
        console.error("Sync test failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
