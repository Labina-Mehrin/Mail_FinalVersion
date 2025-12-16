export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          TareqsDrip Email System
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Automated email management for your e-commerce platform
        </p>
        
        <div className="space-y-4">
          <a
            href="/admin/email/settings"
            className="block px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Admin Email Settings
          </a>
          <a
            href="/admin/email/campaigns"
            className="block px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Manage Campaigns
          </a>
          <a
            href="/settings/email"
            className="block px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200"
          >
            User Email Preferences
          </a>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Built with Next.js 15, SendGrid, Inngest, and Prisma
          </p>
        </div>
      </div>
    </div>
  );
}
