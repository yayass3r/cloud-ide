# كود ستوديو — بيئة تطوير متكاملة سحابية

> Cloud IDE يعمل داخل المتصفح مع ذكاء اصطناعي مدمج

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7?logo=netlify)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## 🚀 الميزات

- **محرر أكواد متقدم** — واجهة مقسمة (Split Screen) مع تلوين بناء الجملة
- **ذكاء اصطناعي مدمج** — مساعد برمجي يعمل باللغة العربية
- **طرفية أوامر** — Terminal محاكي مع 12+ أمر
- **معاينة حية** — عرض فوري للنتائج في iframe
- **لوحة تحكم** — إدارة المشاريع والإحصائيات
- **نظام RBAC** — فصل صلاحيات المسؤول والمستخدم
- **معرض أعمال** — Portfolio عام للمشاريع
- **RTL كامل** — دعم اللغة العربية مع خط Tajawal
- **Dark/Light Mode** — وضع ليلي/نهاري

## 📋 خطوات الإعداد

### 1. إعداد قاعدة البيانات (Supabase)

افتح **لوحة تحكم Supabase**:
```
https://supabase.com/dashboard/project/uuslujxtsrtbvjihcdzw/sql
```

ثم انسخ والصق محتوى الملف:
```
supabase/migrations/001_initial_schema.sql
```

اضغط **Run** لتنفيذ SQL.

### 2. ربط Netlify بـ GitHub

1. افتح **لوحة تحكم Netlify**:
   ```
   https://app.netlify.com/projects/code-studio-ide
   ```

2. اضغط **"Connect to Git"**

3. اختر مستودع:
   ```
   https://github.com/yayass3r/code-studio-ide
   ```

4. إعدادات البناء:
   - **Build command**: `npx next build`
   - **Publish directory**: `.next`

5. أضف **Environment Variables**:
   | المتغير | القيمة |
   |---------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://uuslujxtsrtbvjihcdzw.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_SD_IG-nqT4E4ohaVDYsNlQ_0aAdmWSu` |
   | `SUPABASE_SERVICE_ROLE_KEY` | (مفتاح الخدمة من Supabase) |
   | `NODE_VERSION` | `20` |

6. اضغط **"Deploy site"**

### 3. تشغيل محلياً

```bash
git clone https://github.com/yayass3r/code-studio-ide.git
cd code-studio-ide
bun install
cp .env.example .env.local
# عدّل .env.local بمفاتيح Supabase
bun run dev
```

## 🏗️ التقنيات

| التقنية | الاستخدام |
|---------|----------|
| Next.js 16 | إطار العمل الأساسي |
| TypeScript 5 | لغة البرمجة |
| Tailwind CSS 4 | التصميم |
| shadcn/ui | مكتبة المكونات |
| Supabase | قاعدة البيانات + Auth + Storage |
| Zustand | إدارة الحالة |
| Framer Motion | الرسوم المتحركة |
| z-ai-web-dev-sdk | الذكاء الاصطناعي |
| react-resizable-panels | تقسيم الشاشة |
| bcryptjs | تشفير كلمات المرور |

## 📁 هيكل المشروع

```
code-studio-ide/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # المصادقة
│   │   │   ├── projects/       # إدارة المشاريع
│   │   │   ├── admin/          # لوحة المسؤول
│   │   │   ├── ai/             # الذكاء الاصطناعي
│   │   │   ├── deploy/         # النشر
│   │   │   └── users/          # إدارة المستخدمين
│   │   ├── layout.tsx          # التخطيط الرئيسي (RTL)
│   │   ├── page.tsx            # الصفحة الرئيسية
│   │   └── globals.css         # الأنماط العامة
│   ├── components/
│   │   ├── auth/               # تسجيل الدخول + التسجيل
│   │   ├── dashboard/          # لوحة التحكم + الملف الشخصي
│   │   ├── ide/                # محرر الأكواد + Terminal + Preview
│   │   ├── admin/              # لوحة المسؤول
│   │   ├── chat/               # نافذة الذكاء الاصطناعي
│   │   ├── portfolio/          # معرض الأعمال
│   │   ├── layout/             # الرأس + القائمة الجانبية
│   │   └── ui/                 # مكونات shadcn/ui
│   ├── store/                  # Zustand store
│   ├── lib/                    # Supabase client + utilities
│   └── hooks/                  # Custom React hooks
├── supabase/
│   └── migrations/             # SQL migrations
├── scripts/
│   └── setup-db.js             # سكريبت إعداد قاعدة البيانات
├── prisma/                     # Prisma schema (legacy)
├── netlify.toml                # Netlify configuration
└── package.json
```

## 🔗 الروابط

- **المستودع**: https://github.com/yayass3r/code-studio-ide
- **Netlify**: https://code-studio-ide.netlify.app
- **Supabase**: https://supabase.com/dashboard/project/uuslujxtsrtbvjihcdzw

## 📄 الرخصة

MIT
