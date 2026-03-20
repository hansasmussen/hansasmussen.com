import "./globals.css";

export const metadata = {
  title: "Hans Asmussen",
  description: "Portfolio prototype v2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
