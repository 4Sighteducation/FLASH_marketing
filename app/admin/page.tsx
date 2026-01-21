import { redirect } from 'next/navigation';

// Consolidated admin landing: Users page contains the KPIs + the dense table.
export default function AdminIndex() {
  redirect('/admin/users');
}

