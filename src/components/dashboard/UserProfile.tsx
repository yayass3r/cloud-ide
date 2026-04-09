'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Camera,
  Save,
  Trash2,
  FolderOpen,
  Globe,
  Rocket,
  Calendar,
  Shield,
  X,
  Check,
  Loader2,
  Mail,
  MailCheck,
  Upload,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAppStore, type Project } from '@/store'

export default function UserProfile() {
  const { user, setUser, logout, navigate, apiFetch } = useAppStore()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setBio(user.bio || '')
      setGithubUrl(user.githubUrl || '')
      try {
        const parsed = JSON.parse(user.skills || '[]')
        setSkills(Array.isArray(parsed) ? parsed : [])
      } catch {
        setSkills([])
      }
    }
  }, [user])

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return
      try {
        const res = await apiFetch(`/api/projects?userId=${user.id}`)
        const data = await res.json()
        setProjects(data.projects || [])
      } catch (err) {
        console.error('Error fetching projects:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [user])

  const handleAddSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'خطأ',
          description: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت',
          variant: 'destructive',
        })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name,
        bio,
        skills: JSON.stringify(skills),
        githubUrl,
      }

      // Only send avatar if it was changed
      if (avatarPreview) {
        payload.avatar = avatarPreview
      }

      const res = await apiFetch(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.user) {
        setUser({
          ...user,
          name: data.user.name,
          bio: data.user.bio,
          skills: data.user.skills,
          githubUrl: data.user.githubUrl,
          avatar: data.user.avatar,
          emailVerified: data.user.emailVerified,
        })
        setAvatarPreview(null) // Clear preview after successful save
        toast({
          title: 'تم الحفظ',
          description: 'تم تحديث الملف الشخصي بنجاح',
        })
      } else if (data.error) {
        toast({
          title: 'خطأ',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الملف الشخصي',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublic = async (project: Project) => {
    try {
      const res = await apiFetch('/api/projects', {
        method: 'PUT',
        body: JSON.stringify({ id: project.id, isPublic: !project.isPublic }),
      })
      const data = await res.json()
      if (data.project) {
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, isPublic: !p.isPublic } : p))
        )
      }
    } catch (err) {
      console.error('Error toggling project:', err)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    try {
      await apiFetch(`/api/users/${user.id}`, { method: 'DELETE' })
      logout()
      toast({
        title: 'تم حذف الحساب',
        description: 'تم حذف حسابك بنجاح',
      })
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الحساب',
        variant: 'destructive',
      })
    }
  }

  const handleVerifyEmail = async () => {
    if (!user) return
    try {
      // Request a fresh verification token via a server-side action
      // For now, we mark as verified since email verification requires
      // an actual email service (e.g., Resend, SendGrid) to send a link
      const { default: crypto } = await import('crypto')
      const verifyToken = crypto.randomBytes(16).toString('hex')

      // Call server to generate and store the verification token
      const res = await apiFetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'send-verify-email', userId: user.id }),
      })
      const data = await res.json()

      if (data.success) {
        toast({
          title: 'تم إرسال رابط التحقق',
          description: 'تم إرسال رابط التحقق إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.',
        })
      } else {
        toast({
          title: 'تنبيه',
          description: data.error || 'لم يتم إرسال البريد. يمكنك المحاولة لاحقاً.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال رابط التحقق',
        variant: 'destructive',
      })
    }
  }

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleLabel = user.role === 'admin' ? 'مدير' : 'مستخدم'
  const roleVariant = user.role === 'admin' ? 'default' : 'secondary'

  const publicProjects = projects.filter((p) => p.isPublic).length
  const deployedProjects = projects.filter((p) => p.isDeployed).length

  const displayAvatar = avatarPreview || user.avatar || undefined
  const emailVerified = (user as Record<string, unknown>).emailVerified as boolean | undefined

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden">
          <div className="h-28 md:h-36 bg-gradient-to-l from-emerald-500/20 via-teal-500/10 to-cyan-500/20 relative" />
          <CardContent className="relative pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
              <div className="relative">
                <Avatar className="size-24 md:size-32 border-4 border-background shadow-xl">
                  <AvatarImage src={displayAvatar} alt={user.name} />
                  <AvatarFallback className="text-lg md:text-2xl font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {uploadingAvatar ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                    <Loader2 className="size-5 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 left-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-md hover:bg-primary/90 transition-colors"
                    title="تغيير الصورة الرمزية"
                  >
                    <Camera className="size-3.5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold truncate">{user.name}</h1>
                  <Badge variant={roleVariant as 'default' | 'secondary'} className="w-fit gap-1">
                    <Shield className="size-3" />
                    {roleLabel}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  {emailVerified ? (
                    <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      <MailCheck className="size-3" />
                      تم التحقق
                    </Badge>
                  ) : (
                    <button
                      onClick={handleVerifyEmail}
                      className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      <Mail className="size-3" />
                      تحقق الآن
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  عضو منذ{' '}
                  {new Date(user.createdAt || '').toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('dashboard')} className="hidden sm:flex gap-2">
                العودة للوحة التحكم
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تعديل الملف الشخصي</CardTitle>
                <CardDescription>تحديث معلوماتك الشخصية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar Upload Section */}
                <div className="space-y-2">
                  <Label>الصورة الرمزية</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16 border-2 border-muted">
                      <AvatarImage src={displayAvatar} alt={user.name} />
                      <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5" />
                            تغيير الصورة الرمزية
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, GIF — الحد الأقصى 2 ميجابايت
                      </p>
                    </div>
                  </div>
                  {avatarPreview && (
                    <div className="mt-2 p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <img
                          src={avatarPreview}
                          alt="معاينة الصورة"
                          className="size-12 rounded-full object-cover border"
                        />
                        <span className="text-sm text-muted-foreground">تم اختيار صورة جديدة</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسمك"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">نبذة عنك</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="اكتب نبذة مختصرة عنك..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">المهارات</Label>
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="أضف مهارة ثم اضغط Enter"
                    />
                    <Button type="button" variant="outline" onClick={handleAddSkill} size="icon">
                      <Check className="size-4" />
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          {skill}
                          <X className="size-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">رابط GitHub</Label>
                  <Input
                    id="github"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    dir="ltr"
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 w-full sm:w-auto">
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  <Save className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Portfolio Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معرض الأعمال</CardTitle>
                <CardDescription>إدارة المشاريع المعروضة في معرض الأعمال</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    لا توجد مشاريع حتى الآن
                  </p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FolderOpen className="size-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">{project.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {project.isPublic ? 'عام' : 'خاص'}
                          </span>
                          <Switch
                            checked={project.isPublic}
                            onCheckedChange={() => handleTogglePublic(project)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">الحساب</CardTitle>
                <CardDescription>إعدادات الحساب والخطر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">البريد الإلكتروني</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-medium" dir="ltr">{user.email}</p>
                      {emailVerified ? (
                        <MailCheck className="size-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-500 border-orange-500/30">
                          لم يتم التحقق
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">تاريخ التسجيل</span>
                    <p className="font-medium mt-0.5">
                      {new Date(user.createdAt || '').toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                <Separator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="size-4" />
                      حذف الحساب
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم حذف حسابك وجميع مشاريعك نهائياً. لا يمكن التراجع عن هذا الإجراء.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter dir="rtl">
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        نعم، احذف الحساب
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الإحصائيات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <FolderOpen className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المشاريع</p>
                      <p className="font-bold text-lg">{projects.length}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                      <Globe className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المشاريع العامة</p>
                      <p className="font-bold text-lg">{publicProjects}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                      <Rocket className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المنشورات</p>
                      <p className="font-bold text-lg">{deployedProjects}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">عضو منذ</p>
                      <p className="font-medium text-sm">
                        {new Date(user.createdAt || '').toLocaleDateString('ar-EG', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
