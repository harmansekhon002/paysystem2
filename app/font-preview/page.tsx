import {
  DM_Sans,
  Manrope,
  Outfit,
  Plus_Jakarta_Sans,
  Sora,
  Space_Grotesk,
} from "next/font/google"
import { FontPreview } from "@/components/font-preview"

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

const fontOptions = [
  { id: "plus-jakarta-sans", label: "Plus Jakarta Sans", className: plusJakartaSans.className },
  { id: "manrope", label: "Manrope", className: manrope.className },
  { id: "sora", label: "Sora", className: sora.className },
  { id: "space-grotesk", label: "Space Grotesk", className: spaceGrotesk.className },
  { id: "dm-sans", label: "DM Sans", className: dmSans.className },
  { id: "outfit", label: "Outfit", className: outfit.className },
]

export default function FontPreviewPage() {
  return <FontPreview options={fontOptions} />
}
