import { Sora, DM_Sans } from 'next/font/google'

export const sora = Sora({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

export const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})
