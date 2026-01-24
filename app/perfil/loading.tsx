export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="material-symbols-outlined text-2xl animate-spin">
          progress_activity
        </span>
        <span>Cargando perfil...</span>
      </div>
    </div>
  )
}
