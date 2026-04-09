'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center" dir="rtl">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">حدث خطأ!</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">إعادة المحاولة</button>
      </div>
    </div>
  )
}
