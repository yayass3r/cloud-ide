'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  FolderOpen,
  Rocket,
  HardDrive,
  Search,
  Shield,
  ShieldOff,
  ChevronUp,
  ChevronDown,
  Eye,
  Activity,
  Save,
  Lock,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAppStore, type User } from '@/store'

interface AdminUser extends User {
  _count?: { projects: number; deployments: number }
}

interface AdminStats {
  totalUsers: number
  activeProjects: number
  totalDeployments: number
  publicProjects: number
  storage: string
}

interface ActivityItem {
  id: string
  message: string
  timestamp: string
  type: 'user' | 'project' | 'deployment' | 'system'
}

const ITEMS_PER_PAGE = 8

export default function AdminDashboard() {
  const { user, navigate, apiFetch } = useAppStore()
  const { toast } = useToast()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    userId: string
    action: string
    userName: string
    newValue: unknown
  }>({ open: false, userId: '', action: '', userName: '', newValue: null })

  // Platform settings
  const [maxProjects, setMaxProjects] = useState('10')
  const [maxStorage, setMaxStorage] = useState('500')
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  // Mock activity log
  const mockActivities: ActivityItem[] = [
    { id: '1', message: 'مستخدم جديد قام بالتسجيل', timestamp: 'منذ 5 دقائق', type: 'user' },
    { id: '2', message: 'تم إنشاء مشروع "تطبيق ويب" جديد', timestamp: 'منذ 12 دقيقة', type: 'project' },
    { id: '3', message: 'تم نشر مشروع بنجاح', timestamp: 'منذ 30 دقيقة', type: 'deployment' },
    { id: '4', message: 'تم تحديث إعدادات المنصة', timestamp: 'منذ ساعة', type: 'system' },
    { id: '5', message: 'مستخدم قام بتحديث ملفه الشخصي', timestamp: 'منذ ساعتين', type: 'user' },
    { id: '6', message: 'تم أرشفة مشروع قديم', timestamp: 'منذ 3 ساعات', type: 'project' },
  ]

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, statsRes] = await Promise.all([
          apiFetch('/api/admin/users'),
          apiFetch('/api/admin/stats'),
        ])
        const usersData = await usersRes.json()
        const statsData = await statsRes.json()
        setUsers(usersData.users || [])
        setStats(statsData.stats || null)
      } catch (err) {
        console.error('Error fetching admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleConfirmAction = async () => {
    const { userId, action, newValue } = confirmDialog
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ [action]: newValue }),
      })
      const data = await res.json()
      if (data.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, [action]: newValue } : u))
        )
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث بيانات المستخدم بنجاح',
        })
      }
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث بيانات المستخدم',
        variant: 'destructive',
      })
    } finally {
      setConfirmDialog({ open: false, userId: '', action: '', userName: '', newValue: null })
    }
  }

  const openConfirmDialog = (
    userId: string,
    userName: string,
    action: string,
    newValue: unknown
  ) => {
    setConfirmDialog({ open: true, userId, action, userName, newValue })
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    // Mock save - in real app would save to DB
    await new Promise((r) => setTimeout(r, 1000))
    setSavingSettings(false)
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ إعدادات المنصة بنجاح',
    })
  }

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex p-4 rounded-full bg-destructive/10">
            <Lock className="size-10 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">ليس لديك صلاحية</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة فقط للمديرين</p>
          <Button onClick={() => navigate('dashboard')}>العودة للوحة التحكم</Button>
        </motion.div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'المشاريع النشطة',
      value: stats?.activeProjects ?? 0,
      icon: FolderOpen,
      gradient: 'from-sky-500 to-blue-600',
      iconBg: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400',
    },
    {
      title: 'المنشورات',
      value: stats?.totalDeployments ?? 0,
      icon: Rocket,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400',
    },
    {
      title: 'مساحة التخزين',
      value: stats?.storage ?? '0',
      icon: HardDrive,
      gradient: 'from-orange-500 to-amber-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="size-7 text-primary" />
              لوحة تحكم المدير
            </h1>
            <p className="text-muted-foreground mt-1">إدارة المنصة والمستخدمين</p>
          </div>
          <Button variant="outline" onClick={() => navigate('dashboard')} className="gap-2">
            العودة للرئيسية
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">
                      {card.title}
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-14 mt-2 rounded-md" />
                    ) : (
                      <p className="text-2xl md:text-3xl font-bold mt-2">{card.value}</p>
                    )}
                  </div>
                  <div className={`p-2.5 md:p-3 rounded-xl ${card.iconBg}`}>
                    <card.icon className="size-5 md:size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Users Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">إدارة المستخدمين</CardTitle>
                <CardDescription>
                  {filteredUsers.length} مستخدم مسجل
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن مستخدم..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pr-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>المشاريع</TableHead>
                        <TableHead>تاريخ الانضمام</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell dir="ltr" className="text-left text-sm">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                              <Shield className="size-3" />
                              {u.role === 'admin' ? 'مدير' : 'مستخدم'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                u.isFrozen
                                  ? 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400'
                                  : 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                              }
                            >
                              {u.isFrozen ? 'متجمد' : 'نشط'}
                            </Badge>
                          </TableCell>
                          <TableCell>{u._count?.projects ?? 0}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(u.createdAt || '').toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                title={u.isFrozen ? 'إلغاء التجمد' : 'تجميد'}
                                onClick={() =>
                                  openConfirmDialog(u.id, u.name, 'isFrozen', !u.isFrozen)
                                }
                              >
                                {u.isFrozen ? (
                                  <ShieldOff className="size-4 text-blue-500" />
                                ) : (
                                  <Shield className="size-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                title={u.role === 'admin' ? 'خفض إلى مستخدم' : 'ترقية لمدير'}
                                onClick={() =>
                                  openConfirmDialog(
                                    u.id,
                                    u.name,
                                    'role',
                                    u.role === 'admin' ? 'user' : 'admin'
                                  )
                                }
                              >
                                {u.role === 'admin' ? (
                                  <ChevronDown className="size-4 text-orange-500" />
                                ) : (
                                  <ChevronUp className="size-4 text-emerald-500" />
                                )}
                              </Button>
                              <Button size="icon" variant="ghost" className="size-8" title="عرض">
                                <Eye className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {paginatedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">{u.name}</span>
                          <Badge
                            variant={u.role === 'admin' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {u.role === 'admin' ? 'مدير' : 'مستخدم'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${u.isFrozen ? 'border-blue-300 text-blue-600' : 'border-emerald-300 text-emerald-600'}`}
                          >
                            {u.isFrozen ? 'متجمد' : 'نشط'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate" dir="ltr">
                        {u.email}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {u._count?.projects ?? 0} مشاريع
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() =>
                              openConfirmDialog(u.id, u.name, 'isFrozen', !u.isFrozen)
                            }
                          >
                            {u.isFrozen ? 'إلغاء تجميد' : 'تجميد'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() =>
                              openConfirmDialog(
                                u.id,
                                u.name,
                                'role',
                                u.role === 'admin' ? 'user' : 'admin'
                              )
                            }
                          >
                            {u.role === 'admin' ? 'خفض' : 'ترقية'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      السابق
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentPage} من {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      التالي
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إعدادات المنصة</CardTitle>
              <CardDescription>تحديد إعدادات عامة للمنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="maxProjects">الحد الأقصى للمشاريع لكل مستخدم</Label>
                <Input
                  id="maxProjects"
                  type="number"
                  value={maxProjects}
                  onChange={(e) => setMaxProjects(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStorage">الحد الأقصى للتخزين (ميجابايت)</Label>
                <Input
                  id="maxStorage"
                  type="number"
                  value={maxStorage}
                  onChange={(e) => setMaxStorage(e.target.value)}
                  min="50"
                  max="10000"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>تسجيل مستخدمين جدد</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    السماح بتسجيل حسابات جديدة
                  </p>
                </div>
                <Switch
                  checked={registrationEnabled}
                  onCheckedChange={setRegistrationEnabled}
                />
              </div>
              <Separator />
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full gap-2"
              >
                {savingSettings ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="size-5" />
                سجل النشاط
              </CardTitle>
              <CardDescription>أحدث الأنشطة على المنصة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {mockActivities.map((activity, index) => {
                  const typeColors: Record<string, string> = {
                    user: 'bg-emerald-500',
                    project: 'bg-sky-500',
                    deployment: 'bg-violet-500',
                    system: 'bg-orange-500',
                  }
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="relative mt-1.5">
                        <div
                          className={`size-2.5 rounded-full ${typeColors[activity.type] || 'bg-gray-500'}`}
                        />
                        {index < mockActivities.length - 1 && (
                          <div className="absolute top-3 right-1 bottom-0 w-px bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الإجراء</DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'isFrozen'
                ? confirmDialog.newValue
                  ? `هل تريد تجميد حساب "${confirmDialog.userName}"؟`
                  : `هل تريد إلغاء تجميد حساب "${confirmDialog.userName}"؟`
                : confirmDialog.newValue === 'admin'
                  ? `هل تريد ترقية "${confirmDialog.userName}" إلى مدير؟`
                  : `هل تريد خفض "${confirmDialog.userName}" إلى مستخدم عادي؟`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter dir="rtl">
            <Button variant="outline" onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}>
              إلغاء
            </Button>
            <Button onClick={handleConfirmAction}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
