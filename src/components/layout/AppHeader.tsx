'use client'

import { useTheme } from 'next-themes'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Code2,
  Moon,
  Sun,
  Menu,
  LayoutDashboard,
  User,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'

export default function AppHeader() {
  const { user, navigate, logout } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
  }

  const navTo = (view: 'landing' | 'login' | 'register' | 'dashboard' | 'ide' | 'profile' | 'admin' | 'portfolio') => {
    navigate(view)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo - Right side (RTL) */}
        <button
          onClick={() => navTo(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
            <Code2 className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-l from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            كود ستوديو
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navTo('dashboard')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="size-4" />
                لوحة التحكم
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navTo('profile')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <User className="size-4" />
                ملفي
              </Button>
              {user.role === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navTo('admin')}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Shield className="size-4" />
                  لوحة المسؤول
                </Button>
              )}

              <Separator orientation="vertical" className="mx-1 h-6" />

              {/* User avatar + name */}
              <div className="flex items-center gap-2">
                <Avatar className="size-8 ring-2 ring-emerald-500/20">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                تسجيل الخروج
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navTo('login')} className="gap-2">
                <LogIn className="size-4" />
                تسجيل الدخول
              </Button>
              <Button size="sm" onClick={() => navTo('register')} className="gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <UserPlus className="size-4" />
                إنشاء حساب
              </Button>
            </>
          )}
        </nav>

        {/* Right controls (theme + mobile) */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="size-9 text-muted-foreground hover:text-foreground"
          >
            <Moon className="size-4 scale-0 dark:scale-100 transition-transform" />
            <Sun className="size-4 absolute scale-100 dark:scale-0 transition-transform" />
            <span className="sr-only">تبديل الوضع</span>
          </Button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 pt-8">
              <SheetHeader>
                <SheetTitle className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-lg font-bold">كود ستوديو</span>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                      <Code2 className="size-4 text-white" />
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2 mt-4">
                {user ? (
                  <>
                    {/* User info */}
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 mb-2">
                      <Avatar className="size-10 ring-2 ring-emerald-500/20">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full justify-end gap-2"
                      onClick={() => navTo('dashboard')}
                    >
                      <span>لوحة التحكم</span>
                      <LayoutDashboard className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-end gap-2"
                      onClick={() => navTo('profile')}
                    >
                      <span>ملفي</span>
                      <User className="size-4" />
                    </Button>
                    {user.role === 'admin' && (
                      <Button
                        variant="ghost"
                        className="w-full justify-end gap-2"
                        onClick={() => navTo('admin')}
                      >
                        <span>لوحة المسؤول</span>
                        <Shield className="size-4" />
                      </Button>
                    )}

                    <Separator className="my-2" />

                    <Button
                      variant="outline"
                      className="w-full justify-end gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <span>تسجيل الخروج</span>
                      <LogOut className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-end gap-2"
                      onClick={() => navTo('login')}
                    >
                      <span>تسجيل الدخول</span>
                      <LogIn className="size-4" />
                    </Button>
                    <Button
                      className="w-full justify-end gap-2 bg-gradient-to-l from-emerald-600 to-teal-600"
                      onClick={() => navTo('register')}
                    >
                      <span>إنشاء حساب</span>
                      <UserPlus className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
