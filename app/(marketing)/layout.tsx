import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { HashCleaner } from "@/components/shared/HashCleaner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HashCleaner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
