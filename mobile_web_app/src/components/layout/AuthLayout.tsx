import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#0f172a_0%,#111827_46%,#0b1220_100%)] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_24%)]" />
      <div className="absolute -top-8 left-0 h-40 w-40 rounded-full bg-green-800/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-44 w-44 rounded-full bg-cyan-800/20 blur-3xl" />
      <div className="absolute bottom-10 left-10 h-36 w-36 rounded-full bg-emerald-800/20 blur-3xl" />

      <main className="relative z-10 px-4 py-6">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-sm flex-col justify-center">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
