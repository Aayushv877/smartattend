import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

  try {

    const data = await req.formData();

    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
    });

  } catch (error) {

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}