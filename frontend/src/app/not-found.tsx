import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 dark:bg-[#070e1b] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-2xl font-black">
            404
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            الصفحة غير موجودة | Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله. يرجى العودة إلى المنصة الرئيسية.
          </p>
          <div className="pt-2">
            <Link
              href="/ar"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-lg"
            >
              الذهاب إلى منصة كَنزين الرئيسية
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
