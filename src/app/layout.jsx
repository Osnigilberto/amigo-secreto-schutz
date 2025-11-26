import './globals.css';

export const metadata = {
  title: 'Amigo Secreto da Família Schutz',
  description: 'Lista de desejos para o amigo secreto de Natal',
  themeColor: '#881188',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover', // Para iPhones com notch
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}