import { FontPreview } from "@/components/font-preview"

const fontOptions = [
  { id: "plus-jakarta-sans", label: "Plus Jakarta Sans", className: "[font-family:'Plus_Jakarta_Sans',var(--font-sans)]" },
  { id: "manrope", label: "Manrope", className: "[font-family:'Manrope',var(--font-sans)]" },
  { id: "sora", label: "Sora", className: "[font-family:'Sora',var(--font-sans)]" },
  { id: "space-grotesk", label: "Space Grotesk", className: "[font-family:'Space_Grotesk',var(--font-sans)]" },
  { id: "dm-sans", label: "DM Sans", className: "[font-family:'DM_Sans',var(--font-sans)]" },
  { id: "outfit", label: "Outfit", className: "[font-family:'Outfit',var(--font-sans)]" },
]

export default function FontPreviewPage() {
  return <FontPreview options={fontOptions} />
}
