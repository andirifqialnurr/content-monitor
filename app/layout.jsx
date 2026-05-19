import "./globals.css";

export const metadata = {
  title: "Content Monitor",
  description: "Dashboard timeline dan bank topik kanal IT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
