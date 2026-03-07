import { redirect } from 'next/navigation'

// The old /game route now redirects to lobby
// Real game pages live at /game/[game_id]
export default function OldGamePage() {
  redirect('/')
}
