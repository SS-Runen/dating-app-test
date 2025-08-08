// Global styles
"use client"
import { AppContextProvider } from '@/lib/context/useAppContext';
import '../lib/styles/globals.scss'
import { Suspense } from 'react'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <link rel="apple-touch-icon" sizes="76x76" href="../assets/img/apple-icon.png" />
    <link rel="icon" type="image/png" href="../assets/img/favicon.png" />
    <title>
      Lucent - Dating App
    </title>

    <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700" rel="stylesheet" />

    <link
          rel="stylesheet"
          href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css"
        />

    <link id="pagestyle" href="/css/argon-dashboard.css" rel="stylesheet" />
  </head>

  <body>
    <Suspense fallback={<div>Loading...</div>}>
      <AppContextProvider>{children}</AppContextProvider>
    </Suspense>
  </body>
</html>
  );
}
