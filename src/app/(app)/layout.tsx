import NavInferior from "@/components/NavInferior";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto max-w-md px-4 pb-28 pt-5">{children}</main>
      <NavInferior />
    </>
  );
}
