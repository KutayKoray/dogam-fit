import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DogamFit - AI Nutrition Tracker",
  description: "Track your calories and macros with AI-powered food recognition. Stay healthy, stay fit with DogamFit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                console.error('Global error caught:', e.error || e.message);
                document.body.innerHTML = '<div style="padding:20px;font-family:monospace;background:#fee;"><h1>Error Detected</h1><p><strong>Message:</strong> ' + (e.error?.message || e.message) + '</p><p><strong>File:</strong> ' + (e.filename || 'unknown') + '</p><p><strong>Line:</strong> ' + (e.lineno || 'unknown') + '</p><p><strong>Stack:</strong><pre style="white-space:pre-wrap;font-size:10px;">' + (e.error?.stack || 'N/A') + '</pre></p><button onclick="location.reload()" style="padding:10px;background:#dc2626;color:white;border:none;border-radius:5px;cursor:pointer;">Reload Page</button></div>';
              });
              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
                alert('Promise Error: ' + (e.reason?.message || e.reason));
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
