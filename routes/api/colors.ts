import { colorService } from "../../services/colorService.ts";

export async function POST(req: Request) {
  try {
    await colorService.init();

    const body = await req.json();
    const updatedColors = await colorService.setColors(body);

    return new Response(JSON.stringify({ success: true, colors: updatedColors }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update colors:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  try {
    await colorService.init();
    const colors = await colorService.getColors();

    return new Response(JSON.stringify(colors), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to get colors:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
