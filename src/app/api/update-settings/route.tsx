import { NextRequest, NextResponse } from "next/server";
import { getFirebaseApp } from "../../../lib/firebase/client";
import { doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
    const { showMe, userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    try {
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);

        const update: any = {
            showMe,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, "users", userId), update);
        return NextResponse.json({ message: "Settings updated" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}