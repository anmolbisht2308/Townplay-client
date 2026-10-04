/** Click-to-chat link (no WhatsApp API): opens WhatsApp with a prefilled message. */
export function waLink(phone10: string, text: string): string {
  return `https://wa.me/91${phone10}?text=${encodeURIComponent(text)}`;
}

/** Opens WhatsApp's share sheet (pick any chat) with a prefilled message. */
export function waShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
