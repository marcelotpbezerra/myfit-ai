import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

const syncRequestSchema = z.object({
  origin: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const validated = syncRequestSchema.parse(body);

    const env = { ...process.env };
    if (validated.date) {
      env.MYFIT_SYNC_DATE = validated.date;
    }

    const { stdout, stderr } = await execAsync("python3 /root/scripts/myfit_sync.py", { env });
    
    return NextResponse.json({ 
      success: true, 
      output: stdout,
      error: stderr,
      validated 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid payload", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
