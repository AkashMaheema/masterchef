import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.formData()
    const file = data.get("file") as File
    
    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn("Cloudinary not configured. Mocking upload.")
      return NextResponse.json({ url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80" })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const response = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'auto', folder: "masterchef" }, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }).end(buffer)
    })

    return NextResponse.json({ url: (response as any).secure_url })
  } catch (err: any) {
    return new NextResponse("Upload failed: " + err.message, { status: 500 })
  }
}
