import { Inter, Barlow_Condensed, Sora, Space_Grotesk, DM_Sans } from 'next/font/google'

export const inter = Inter({ subsets: ['latin'] })

// Fonts for design direction samples
export const barlowCondensed = Barlow_Condensed({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow-condensed'
})

export const sora = Sora({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sora'
})

export const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

export const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans'
})
