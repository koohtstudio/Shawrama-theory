import type { Metadata } from "next";
import { TemplateEditor, type Template } from "@/components/admin/TemplateEditor";
import { requireStaff } from "@/lib/security/admin-action";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const { supabase } = (await requireStaff())!;
  const { data } = await supabase.from("message_templates").select("*").order("key").order("channel");
  return <TemplateEditor templates={(data ?? []) as Template[]} />;
}
