import { getFirebaseApp } from "../../../lib/firebase/client";
import { getFirestore, getDoc, doc } from "firebase/firestore";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    try {
        const userId = searchParams.get("userId");
        if (!userId) {
            return Response.json({ error: "User ID is required" }, { status: 400 });
        }

        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }
        const userData = userDoc.data();
        const user = {
            id: userDoc.id,
            ...userData,
        }
        return Response.json(user);
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Failed to get user" }, { status: 500 });
    }
}