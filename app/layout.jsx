import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata = {
  title: "Content Monitor",
  description: "Creator workspace untuk events, produk digital, course, dan public page",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
