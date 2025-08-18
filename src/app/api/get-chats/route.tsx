import { getFirebaseApp } from "@/lib/firebase/client";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { chatConverter } from "@/lib/models/chat";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    try {
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);

        const chatsRef = collection(db, "chats").withConverter(chatConverter);
        const q = query(chatsRef, where("memberIds", "array-contains", userId));

        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.map(doc => doc.data());

        return NextResponse.json({ chats }, { status: 200 });
    } catch (error) {
        console.error("Failed to get chats:", error);
        return NextResponse.json({ message: "Failed to get chats" }, { status: 500 });
    }
}
