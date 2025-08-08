import admin from "firebase-admin";
import { getFirebaseApp } from "../../../lib/firebase/client";
import { doc, getFirestore, setDoc, serverTimestamp, Timestamp, getDoc } from "firebase/firestore";
import { Readable } from "stream";


export async function POST(req: Request) {
    const formData = await req.formData();
    const name = formData.get("name");
    const aboutMe = formData.get("aboutMe");
    const profilePicture = formData.get("profilePicture") as File;
    const birthdate = formData.get("birthdate") as string;
    const uid = formData.get("uid");
    const gender = formData.get("gender");
    const showMe = formData.get("showMe");
    try {
        if (admin.apps.length === 0) {
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
            const parseServivceAccount = JSON.parse(serviceAccount as string);
            admin.initializeApp({
              credential: admin.credential.cert(parseServivceAccount),
            });
        }
        const firebaseUser = await admin.auth().getUser(uid as string);
        if (!firebaseUser) {
            return Response.json({ message: "User not found" }, { status: 404 });
        }

        // Check if user already exists
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);
        const existingUserRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(existingUserRef);
        if (userDoc.exists()) {
            return Response.json({ message: "User already exists" }, { status: 400 });
        }

        // Save the user to firestore database
        const user = {
            id: firebaseUser.uid,
            name,
            aboutMe,
            gender,
            showMe,
            birthdate: Timestamp.fromDate(new Date(birthdate)),
            profilePicture: "",
            email: firebaseUser.email ? firebaseUser.email : null,
            phoneNumber: firebaseUser.phoneNumber ? firebaseUser.phoneNumber : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }

        const profilePictureUrl = await uploadImage(profilePicture);
        if (profilePictureUrl) {
            user.profilePicture = profilePictureUrl as string;
        }

        const userRef = doc(db, "users", firebaseUser.uid);
        await setDoc(userRef, user);
        return Response.json({ message: "User registered successfully", user });
    } catch (error) {
        console.error(error);
        return Response.json({ message: "Failed to register user" }, { status: 500 });
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