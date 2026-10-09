export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="marque min-h-screen flex flex-col">{children}</div>;
}
