import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { house } from "@/lib/house";

export const metadata: Metadata = {
  title: `Admin — ${house.name}`,
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sand/30">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">{children}</main>
      <footer className="border-t border-clay/25 bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-pine/70">
          Private house admin · {house.address}
        </div>
      </footer>
    </div>
  );
}
