import { getFirebaseApp } from "@/lib/firebase/client";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { chatConverter } from "@/lib/models/chat";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    console.log("[GET /api/get-chats] called");
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    console.log("[GET /api/get-chats] userId:", userId);

    if (!userId) {
        console.warn("[GET /api/get-chats] Missing userId");
        return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    try {
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);

        const chatsRef = collection(db, "chats").withConverter(chatConverter);
        const q = query(chatsRef, where("memberIds", "array-contains", userId));

        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.map(doc => doc.data());
        console.log(`[GET /api/get-chats] Found ${chats.length} chats for userId ${userId}`);

        return NextResponse.json({ chats }, { status: 200 });
    } catch (error) {
        console.error("[GET /api/get-chats] Failed to get chats:", error);
        return NextResponse.json({ message: "Failed to get chats" }, { status: 500 });
    }
}
