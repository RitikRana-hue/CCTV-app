import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Wireless CCTV Platform',
    description: 'Professional CCTV streaming platform with RTSP to HLS conversion',
    keywords: ['cctv', 'streaming', 'rtsp', 'hls', 'surveillance'],
    authors: [{ name: 'CCTV Platform Team' }],
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#000000',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <div id="root">
                    {children}
                </div>
            </body>
        </html>
    );
}