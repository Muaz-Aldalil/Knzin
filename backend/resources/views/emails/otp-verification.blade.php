<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رمز التحقق | كَنزين</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 36px 32px 24px 32px; background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%); border-bottom: 1px solid #f1f5f9;">
                            <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="width: 48px; height: 48px; background-color: #2563eb; border-radius: 12px; color: #ffffff; font-size: 24px; font-weight: bold; line-height: 48px; text-align: center;">
                                        ك
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 16px 0 4px 0; font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; letter-spacing: -0.5px;">
                                كَنزين | KNZiN
                            </h1>
                            <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                                منصة الدورات المهنية والجوائز الترويجية
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #1e293b; text-align: center;">
                                رمز التحقق لتسجيل الدخول
                            </h2>
                            <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                                استخدم الرمز المكون من 6 أرقام أدناه لتأكيد دخولك السريع إلى حسابك في كَنزين.
                            </p>

                            <!-- Code Box -->
                            <div style="background-color: #f0f7ff; border: 2px dashed #93c5fd; border-radius: 16px; padding: 24px; text-align: center; margin: 0 0 28px 0;">
                                <div style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #1d4ed8; text-align: center; padding-right: 12px; direction: ltr;">
                                    {{ $code }}
                                </div>
                                <p style="margin: 12px 0 0 0; font-size: 12px; font-weight: 600; color: #0284c7;">
                                    صالح لمدة {{ $expiresInMinutes }} دقائق فقط
                                </p>
                            </div>

                            <!-- Security Notice -->
                            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 14px 16px; margin: 0 0 24px 0;">
                                <p style="margin: 0; font-size: 12px; color: #b91c1c; line-height: 1.5; text-align: start;">
                                    ⚠️ <strong>تنبيه أمان:</strong> لا تشارك هذا الرمز مع أي شخص. فريق كَنزين لن يطلب منك هذا الرمز أبداً. إذا لم تقم بطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.
                                </p>
                            </div>

                            <!-- English Note -->
                            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; direction: ltr;">
                                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                                    Your 6-digit KNZiN verification code is <strong>{{ $code }}</strong>. Valid for {{ $expiresInMinutes }} minutes. If you did not request this, please ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">
                                © {{ date('Y') }} منصة كَنزين (KNZiN). جميع الحقوق محفوظة.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                                تطوير وتشغيل ديجتال أيج للحلول التقنية (DigAge)
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
