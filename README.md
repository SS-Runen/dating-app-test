This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Due Date: Monday, August 18, 2025. End of day, 05:00 PM / 17:00.
Firestore emulator runs at port 4040. The emulator UI is at the default available port.

1. Create a new firebase project and enable the following services (Free plan is enough):
- Authentication (Phone and Google sign-in methods)
- Firestore Database
    - Create a new collection called "users"
        - Add the following fields:
            - id (string)
            - aboutMe (string)
            - birthdate (timestamp)
            - gender (string)
            - createdAt (timestamp)
            - name (string)
            - phoneNumber (string)
            - profilePicture (string)
            - showMe (string)
            - updatedAt (timestamp)
    - Create a new collection called "user_matches"
        - Add the following fields:
            - id (string)
            - matchedUserId (string)
            - userId (string)
            - status (string)
    - Create a new collection called "chats"
        - Add the following fields:
            - id (string)
            - updatedAt (timestamp)
            - memberIds (array of strings)
            - members (map)
                - id (user id) (string)
                    - name (string)
                    - profilePicture (string)
                - Example:
                    - "1234567890": {
                        "name": "John Doe",
                        "profilePicture": "https://example.com/profile.jpg"
                    }
            - messages (array of objects)
              - id (string)
              - createdAt (timestamp)
              - senderId (string)
              - text (string)
              - Example:
                - [
                    {
                    "id": "1234567890",
                    "createdAt": "2021-01-01T00:00:00Z",
                    "senderId": "1234567890",
                    "text": "Hello, how are you?"
                   }
                ]

2. Create a new cloudinary account (Free plan is enough) to get the cloudinary credentials

3. Create .env.local file and add the following variables:
```
NEXT_PUBLIC_FIREBASE_CONFIG=
FIREBASE_SERVICE_ACCOUNT=
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET=
```

4. Install dependencies:
```bash
npm install
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

The app domain supplied by Vercel is:
https://dating-app-test-xi.vercel.app/

The Vercel app version is tied to this GitHub repository.

## Improvements

### Allow User to Close Phone Number Input Modal
Allow the user to close the phone number input modal by clicking an X button or clicking outside the modal form.

### Fetch Authentication Information from Remote
Fetch the "authentication state" from Firebase instead of local storage. It is more secure and fits better with Firebase documentation.

### Modify Schema to Avoid Using Arrays
Use a sub-colleciton under the chats documents to store the messages under each chat. This will avoid running into array size limits. It requires extra queries to get data but is more in line with Firestore documentation recommendations.
