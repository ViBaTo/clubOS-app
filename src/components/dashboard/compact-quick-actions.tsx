import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserPlus, Calendar, Settings, MoreHorizontal, Plus, GraduationCap } from "lucide-react"

export function CompactQuickActions() {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3 text-xs font-medium bg-white hover:bg-[#14B8A6]/5 hover:text-[#14B8A6] border-[#E2E8F0]"
        asChild
      >
        <a href="/clientes/nuevo" className="flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Nuevo Cliente
        </a>
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3 text-xs font-medium bg-white hover:bg-[#14B8A6]/5 hover:text-[#14B8A6] border-[#E2E8F0]"
        asChild
      >
        <a href="/productos/clases/nueva" className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Programar Clase
        </a>
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3 text-xs font-medium bg-white hover:bg-[#14B8A6]/5 hover:text-[#14B8A6] border-[#E2E8F0]"
        asChild
      >
        <a href="/configuracion" className="flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5" />
          Configurar
        </a>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 bg-white hover:bg-[#14B8A6]/5 hover:text-[#14B8A6] border-[#E2E8F0]"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <a href="/productos/academia/nuevo" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Nuevo Programa
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/reportes" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ver Reportes
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
