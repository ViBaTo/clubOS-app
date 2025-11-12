"use client"

import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { formatTime } from "@/src/utils/calendar-helpers"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface DragDropOverlayProps {
  draggedEvent: CalendarEvent | null
  dropZone: {
    date: Date
    hour?: string
    isValid: boolean
  } | null
  conflicts: CalendarEvent[]
  onConfirm: () => void
  onCancel: () => void
}

export function DragDropOverlay({ draggedEvent, dropZone, conflicts, onConfirm, onCancel }: DragDropOverlayProps) {
  if (!draggedEvent || !dropZone) return null

  const newStartDate = new Date(dropZone.date)
  if (dropZone.hour) {
    const [hourNum, minuteNum] = dropZone.hour.split(":").map(Number)
    newStartDate.setHours(hourNum, minuteNum, 0, 0)
  }

  const originalDuration = new Date(draggedEvent.fechaFin).getTime() - new Date(draggedEvent.fechaInicio).getTime()
  const newEndDate = new Date(newStartDate.getTime() + originalDuration)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              dropZone.isValid ? "bg-green-100" : "bg-red-100",
            )}
          >
            <MaterialIcon
              name={dropZone.isValid ? "check_circle" : "error"}
              className={cn("text-xl", dropZone.isValid ? "text-green-600" : "text-red-600")}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">
              {dropZone.isValid ? "Confirmar movimiento" : "Conflicto detectado"}
            </h3>
            <p className="text-sm text-[#6B7280]">
              {dropZone.isValid ? "¿Mover la clase a la nueva fecha y hora?" : "La nueva hora entra en conflicto"}
            </p>
          </div>
        </div>

        {/* Event details */}
        <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4">
          <h4 className="font-medium text-[#0F172A] mb-2">{draggedEvent.titulo}</h4>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Fecha actual:</span>
              <span className="text-[#0F172A]">
                {new Date(draggedEvent.fechaInicio).toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                {formatTime(new Date(draggedEvent.fechaInicio))} - {formatTime(new Date(draggedEvent.fechaFin))}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Nueva fecha:</span>
              <span className={cn("font-medium", dropZone.isValid ? "text-green-600" : "text-red-600")}>
                {newStartDate.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                {formatTime(newStartDate)} - {formatTime(newEndDate)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Pista:</span>
              <span className="text-[#0F172A]">{draggedEvent.pista.nombre}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Instructor:</span>
              <span className="text-[#0F172A]">{draggedEvent.instructor.nombre}</span>
            </div>
          </div>
        </div>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <MaterialIcon name="warning" className="text-lg" />
              Conflictos detectados ({conflicts.length})
            </h5>
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="text-sm text-red-700 bg-red-100 rounded p-2">
                  <div className="font-medium">{conflict.titulo}</div>
                  <div className="text-xs">
                    {formatTime(new Date(conflict.fechaInicio))} - {formatTime(new Date(conflict.fechaFin))} •{" "}
                    {conflict.pista.nombre}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-[#6B7280] bg-[#F9FAFB] hover:bg-[#F3F4F6] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!dropZone.isValid}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              dropZone.isValid
                ? "bg-[#1E40AF] hover:bg-[#1D4ED8] text-white"
                : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed",
            )}
          >
            {dropZone.isValid ? "Confirmar movimiento" : "No se puede mover"}
          </button>
        </div>
      </div>
    </div>
  )
}
