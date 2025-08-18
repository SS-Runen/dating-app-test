import { getFirebaseApp } from "@/lib/firebase/client";
import { getFirestore, collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Message, messageConverter } from "@/lib/models/chat";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    console.log("[POST /api/send-message] called");
    try {
        const { chatId, senderId, text } = await req.json();
        console.log("[POST /api/send-message] chatId:", chatId, "senderId:", senderId, "text:", text);

        if (!chatId || !senderId || !text) {
            console.warn("[POST /api/send-message] Missing required fields");
            return NextResponse.json({ message: "Chat ID, sender ID, and text are required" }, { status: 400 });
        }

        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);

        const messagesRef = collection(db, `chats/${chatId}/messages`).withConverter(messageConverter);
        
        const newMessage = new Message({
            id: '', // Firestore will generate this
            senderId,
            text,
        });

        await addDoc(messagesRef, newMessage);

        // Update the chat's updatedAt timestamp and last message
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            updatedAt: serverTimestamp(),
            lastMessage: newMessage.toFirestore(),
        });

        console.log("[POST /api/send-message] Message sent successfully");
        return NextResponse.json({ message: "Message sent successfully" }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/send-message] Failed to send message:", error);
        return NextResponse.json({ message: "Failed to send message" }, { status: 500 });
    }
}
