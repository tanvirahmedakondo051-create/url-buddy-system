import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, fmtDate, taka } from "@/lib/auth";
import { Btn, Field, Input, PageHeader, Panel, Select, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/promotions")({ component: Promotions });

function Promotions() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: async () => {
      const [v, c, cl] = await Promise.all([
        supabase.from("vouchers").select("*").order("created_at", { ascending: false }),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("voucher_claims").select("id,amount,created_at,vouchers(code),profiles(full_name,email)").order("created_at", { ascending: false }).limit(50),
      ]);
      return { v: v.data ?? [], c: c.data ?? [], cl: cl.data ?? [] };
    },
  });
  const [vf, setVf] = useState({ code: "", amount: "", max_uses: "1", expires_at: "" });
  const [cf, setCf] = useState({ code: "", kind: "percent", value: "", max_uses: "0", expires_at: "" });
  const log = (action: string, target: string) => supabase.from("admin_logs").insert({ admin_id: user.id, action, target });

  const addVoucher = async () => {
    if (!vf.code.trim() || !(Number(vf.amount) > 0)) return toast.error("Enter a code and amount");
    const { error } = await supabase.from("vouchers").insert({ code: vf.code.trim().toUpperCase(), amount: Number(vf.amount), max_uses: Number(vf.max_uses) || 1, expires_at: vf.expires_at || null });
    if (error) return toast.error(errMsg(error));
    await log("Created voucher", vf.code.toUpperCase());
    setVf({ code: "", amount: "", max_uses: "1", expires_at: "" });
    toast.success("Voucher created"); qc.invalidateQueries({ queryKey: ["admin-promos"] });
  };
  const addCoupon = async () => {
    if (!cf.code.trim() || !(Number(cf.value) > 0)) return toast.error("Enter a code and value");
    const { error } = await supabase.from("coupons").insert({ code: cf.code.trim().toUpperCase(), kind: cf.kind, value: Number(cf.value), max_uses: Number(cf.max_uses) || 0, expires_at: cf.expires_at || null });
    if (error) return toast.error(errMsg(error));
    await log("Created coupon", cf.code.toUpperCase());
    setCf({ code: "", kind: "percent", value: "", max_uses: "0", expires_at: "" });
    toast.success("Coupon created"); qc.invalidateQueries({ queryKey: ["admin-promos"] });
  };
  const toggle = async (table: "vouchers" | "coupons", id: string, active: boolean) => {
    const { error } = await supabase.from(table).update({ active }).eq("id", id);
    if (error) return toast.error(errMsg(error));
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
  };
  const del = async (table: "vouchers" | "coupons", id: string) => {
    if (!confirm("Delete this code?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(errMsg(error));
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
  };

  return (
    <>
      <PageHeader title="Vouchers & coupons" sub="Vouchers add wallet credit. Coupons give a discount at checkout." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-4 font-display font-semibold text-white">New gift voucher</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code"><Input value={vf.code} onChange={(e) => setVf({ ...vf, code: e.target.value })} placeholder="ZERO100" /></Field>
            <Field label="Amount (৳)"><Input type="number" value={vf.amount} onChange={(e) => setVf({ ...vf, amount: e.target.value })} /></Field>
            <Field label="Total uses"><Input type="number" value={vf.max_uses} onChange={(e) => setVf({ ...vf, max_uses: e.target.value })} /></Field>
            <Field label="Expires (optional)"><Input type="date" value={vf.expires_at} onChange={(e) => setVf({ ...vf, expires_at: e.target.value })} /></Field>
          </div>
          <Btn className="mt-4" onClick={addVoucher}>Create voucher</Btn>
          <Table head={["Code", "Amount", "Used", "Expires", ""]}>
            {(data?.v ?? []).map((v) => (
              <tr key={v.id}>
                <Td className="font-mono text-white">{v.code}</Td><Td>{taka(v.amount)}</Td><Td>{v.used_count}/{v.max_uses}</Td><Td>{v.expires_at ? fmtDate(v.expires_at) : "—"}</Td>
                <Td className="whitespace-nowrap text-right">
                  <button className="mr-3 text-xs text-cyan" onClick={() => toggle("vouchers", v.id, !v.active)}>{v.active ? "Disable" : "Enable"}</button>
                  <button className="text-xs text-rose-400" onClick={() => del("vouchers", v.id)}>Delete</button>
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-4 font-display font-semibold text-white">New discount coupon</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code"><Input value={cf.code} onChange={(e) => setCf({ ...cf, code: e.target.value })} placeholder="SAVE20" /></Field>
            <Field label="Type"><Select value={cf.kind} onChange={(e) => setCf({ ...cf, kind: e.target.value })}><option value="percent">Percent %</option><option value="fixed">Fixed ৳</option></Select></Field>
            <Field label="Value"><Input type="number" value={cf.value} onChange={(e) => setCf({ ...cf, value: e.target.value })} /></Field>
            <Field label="Total uses (0 = unlimited)"><Input type="number" value={cf.max_uses} onChange={(e) => setCf({ ...cf, max_uses: e.target.value })} /></Field>
            <Field label="Expires (optional)"><Input type="date" value={cf.expires_at} onChange={(e) => setCf({ ...cf, expires_at: e.target.value })} /></Field>
          </div>
          <Btn className="mt-4" onClick={addCoupon}>Create coupon</Btn>
          <Table head={["Code", "Discount", "Used", "Expires", ""]}>
            {(data?.c ?? []).map((c) => (
              <tr key={c.id}>
                <Td className="font-mono text-white">{c.code}</Td><Td>{c.kind === "percent" ? `${c.value}%` : taka(c.value)}</Td><Td>{c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}</Td><Td>{c.expires_at ? fmtDate(c.expires_at) : "—"}</Td>
                <Td className="whitespace-nowrap text-right">
                  <button className="mr-3 text-xs text-cyan" onClick={() => toggle("coupons", c.id, !c.active)}>{c.active ? "Disable" : "Enable"}</button>
                  <button className="text-xs text-rose-400" onClick={() => del("coupons", c.id)}>Delete</button>
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
      <Panel className="mt-6 p-5">
        <h2 className="mb-3 font-display font-semibold text-white">Recent voucher claims</h2>
        <Table head={["Client", "Code", "Amount", "Date"]}>
          {(data?.cl ?? []).map((c) => {
            const p = c.profiles as { full_name: string | null; email: string | null } | null;
            return <tr key={c.id}><Td className="text-white">{p?.full_name || p?.email}</Td><Td className="font-mono">{(c.vouchers as { code: string } | null)?.code}</Td><Td className="text-mint">{taka(c.amount)}</Td><Td>{fmtDate(c.created_at)}</Td></tr>;
          })}
        </Table>
      </Panel>
    </>
  );
}
