import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-4 bg-surface-primary border border-border-subtle p-8 rounded-2xl shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-2xl font-black">
          404
        </div>
        <h1 className="text-xl font-bold text-content-primary">
          الصفحة غير موجودة | Page Not Found
        </h1>
        <p className="text-xs text-content-muted leading-relaxed">
          الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله. يرجى العودة إلى المنصة الرئيسية.
        </p>
        <div className="pt-2">
          <Link
            href="/ar"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-colors shadow-lg"
          >
            الذهاب إلى منصة كَنزين الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
