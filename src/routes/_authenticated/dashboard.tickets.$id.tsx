import { createFileRoute, Link } from "@tanstack/react-router";
import { TicketThread } from "@/components/panel/TicketThread";

export const Route = createFileRoute("/_authenticated/dashboard/tickets/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  return (
    <div className="max-w-3xl">
      <Link to="/dashboard/tickets" className="mb-4 inline-block text-sm text-slate-400 hover:text-white">← All tickets</Link>
      <TicketThread ticketId={id} userId={user.id} staff={false} />
    </div>
  );
}
