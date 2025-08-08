import { NextRequest, NextResponse } from "next/server";
import { getFirebaseApp } from "../../../lib/firebase/client";
import { doc, getFirestore, serverTimestamp, updateDoc, Timestamp } from "firebase/firestore";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const name = formData.get("name");
    const aboutMe = formData.get("aboutMe");
    const profilePicture = formData.get("profilePicture") as File | undefined;
    const birthdate = formData.get("birthdate") as string;
    const userId = formData.get("userId");
    const gender = formData.get("gender");

    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    try {
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);

        const update: any = {
          name,
          aboutMe,
          birthdate: Timestamp.fromDate(new Date(birthdate)),
          updatedAt: serverTimestamp(),
          gender,
        };
        let profilePictureUrl = null;
        if (profilePicture && profilePicture?.size > 0) {
            profilePictureUrl = await uploadImage(profilePicture);
            if (profilePictureUrl) {
                update.profilePicture = profilePictureUrl;
            }
        }
        const userRef = doc(db, "users", userId as string);
        await updateDoc(userRef, update)
        return NextResponse.json({ message: "Profile updated" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}

/////////////////////////
// Uploads an image file
/////////////////////////
const uploadImage = async (imageFile: File) => {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
    });

    const options = {
      resource_type: "image",
      format: 'jpg',
      folder: "dating-app-profile-pictures",
      disable_promises: true,
    };

    try {
      // Upload the image
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const stream = Readable.from(buffer);

          // Return a promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        });
        stream.pipe(uploadStream);
      });
    } catch (error) {
      console.error(error);
    }
};