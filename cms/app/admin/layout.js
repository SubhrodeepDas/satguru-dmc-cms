import Sidebar from '../../components/Sidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-canvas p-3 sm:p-5">
      <div className="mx-auto max-w-[1600px] h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2.5rem)] bg-white rounded-3xl shadow-panel flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 sm:p-9">{children}</main>
      </div>
    </div>
  );
}
