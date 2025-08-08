import { NextRequest, NextResponse } from "next/server";
import { getFirebaseApp } from "../../../lib/firebase/client";
import { and, collection, documentId, getDocs, getFirestore, or, query, where } from "firebase/firestore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const firebaseApp = getFirebaseApp();
  const db = getFirestore(firebaseApp);

  const matchesRef = collection(db, "/user_matches");
  const q = query(matchesRef, 
    and(where("status", "==", "Interested"), 
    or(where("userId", "==", userId), 
    where("matchedUserId", "==", userId))
  ));

  const querySnapshot = await getDocs(q);
  const matches = querySnapshot.docs.map((doc) => doc.data());

  //   Filter records where userId has a match:
  const matchedUsersIds: string[] = [];
  for (const match of matches) {
      if (matchedUsersIds.includes(match.userId) || matchedUsersIds.includes(match.matchedUserId)) {
          continue;
      }

      const matchedUserIdToFind = match.matchedUserId;
      const userIdToFind = match.userId;
      const matchRecord = matches.find((m) => m.userId === userIdToFind && m.matchedUserId === matchedUserIdToFind);
      if (matchRecord) {
        matchedUsersIds.push(matchRecord.userId === userId ? matchRecord.matchedUserId : matchRecord.userId);
      }
  }

  // Find all users with the matchedUsersIds
  if (matchedUsersIds.length > 0) {
  const matchedUsers = await getDocs(query(collection(db, "/users"), where(documentId(), "in", matchedUsersIds)));
  const matchedUsersData = matchedUsers.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    }
  });

    return NextResponse.json(matchedUsersData);
  }

  return NextResponse.json([]);
}