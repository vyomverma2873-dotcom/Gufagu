export default function CopyrightPage() {
  const currentYear = new Date().getFullYear();
  return (
    <div className="min-h-[calc(100vh-4rem)] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Copyright Notice</h1>
        </div>
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-8 shadow-lg space-y-4">
          <p className="text-neutral-300">© {currentYear} Guftagu Platform. All rights reserved.</p>
          <p className="text-neutral-400">Website created and maintained by Vyom Verma.</p>
          <p className="text-neutral-400">All content, design, and code are protected by copyright law.</p>
        </div>
      </div>
    </div>
  );
}
