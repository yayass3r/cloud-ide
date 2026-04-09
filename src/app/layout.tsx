import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cloud-ide-ar.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "كود ستوديو — بيئة تطوير متكاملة في المتصفح",
    template: "%s | كود ستوديو",
  },
  description:
    "اكتب، شغّل، وانشر أكوادك من أي مكان. بيئة تطوير سحابية متكاملة مع ذكاء اصطناعي مدمج، محرر أكواد متقدم، طرفية أوامر، ونشر فوري.",
  keywords: [
    "كود ستوديو",
    "بيئة تطوير",
    "Cloud IDE",
    "محرر أكواد",
    "تطوير ويب",
    "برمجة",
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "نشر مواقع",
    "ذكاء اصطناعي",
    "محرر سحابي",
    "IDE عربي",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "كود ستوديو — بيئة تطوير متكاملة في المتصفح",
    description:
      "اكتب، شغّل، وانشر أكوادك من أي مكان. بيئة تطوير سحابية مع ذكاء اصطناعي مدمج ونشر فوري.",
    type: "website",
    url: siteUrl,
    siteName: "كود ستوديو",
    locale: "ar_AR",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "كود ستوديو — بيئة تطوير متكاملة في المتصفح",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "كود ستوديو — بيئة تطوير متكاملة في المتصفح",
    description:
      "اكتب، شغّل، وانشر أكوادك من أي مكان. بيئة تطوير سحابية مع ذكاء اصطناعي مدمج ونشر فوري.",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "'Tajawal', 'Geist', sans-serif" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
