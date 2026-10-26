export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, #fff 0%, #faf6ef 55%, #f1e6d8 100%)",
      }}
    >
      {children}
    </div>
  );
}
