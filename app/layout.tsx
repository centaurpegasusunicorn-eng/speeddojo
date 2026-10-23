import type { Metadata } from "next";
import { ThemeSync } from "@/lib/theme";
import { THEME_SCRIPT } from "@/lib/themeScript";
import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        {/* Applies the saved light/dark choice before the first paint */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
