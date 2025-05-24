export default function FullDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {children}
    </div>
  );
}
