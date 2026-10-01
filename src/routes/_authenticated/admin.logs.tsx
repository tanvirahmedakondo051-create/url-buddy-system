import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/logs")({ component: Logs });

function Logs() {
  const { data } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data: logs } = await supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(300);
      const ids = [...new Set((logs ?? []).map((l) => l.admin_id).filter(Boolean))] as string[];
      const { data: admins } = ids.length ? await supabase.from("profiles").select("id,email").in("id", ids) : { data: [] };
      const map = Object.fromEntries((admins ?? []).map((a) => [a.id, a.email]));
      return (logs ?? []).map((l) => ({ ...l, who: l.admin_id ? map[l.admin_id] : "System" }));
    },
  });
  return (
    <>
      <PageHeader title="Activity log" sub="Every admin action, newest first." />
      <Table head={["Time", "Admin", "Action", "Target"]} empty={data?.length === 0}>
        {data?.map((l) => (
          <tr key={l.id}>
            <Td className="font-mono text-xs">{new Date(l.created_at).toLocaleString()}</Td>
            <Td>{l.who}</Td>
            <Td className="text-white">{l.action}</Td>
            <Td className="text-slate-400">{l.target ?? "—"}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
