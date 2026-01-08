import { redirect } from 'next/navigation';

// Public link for testers.
// We host this route on fl4shcards.com (marketing) but the form UI lives in the web app (www.fl4sh.cards).
export default function TesterFeedbackPage() {
  redirect('https://www.fl4sh.cards/tester-feedback');
}

