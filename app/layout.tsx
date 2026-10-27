import type { Metadata, Viewport } from "next";
import { Bad_Script, Geist, Geist_Mono, Lora, Ms_Madi, Open_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonts for the diary text (see lib/fonts.ts) — self-hosted via next/font.
// Lora is the default. All four include the vietnamese subset (Lora used to
// ship latin only, so accented letters fell back to a system font). The
// optional three skip preload so pages that never show them don't fetch them.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  preload: false,
});

const msMadi = Ms_Madi({
  variable: "--font-ms-madi",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: "400",
  preload: false,
});

const badScript = Bad_Script({
  variable: "--font-bad-script",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: "400",
  preload: false,
});

// interactiveWidget: with the on-screen keyboard open, Chrome on Android
// resizes the layout viewport (so the docked toolbar sits above the
// keyboard) instead of just covering the bottom of the page.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  // Light-only app: stops iOS/Android from auto-darkening or restyling it.
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "Together Diary",
  description: "Nhật ký cá nhân hàng ngày",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${openSans.variable} ${msMadi.variable} ${badScript.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
