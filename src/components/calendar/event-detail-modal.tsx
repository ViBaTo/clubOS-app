"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { formatTime, getStatusColor } from "@/src/utils/calendar-helpers"
import { MaterialIcon } from "@/components/material-icon" // Assuming MaterialIcon is a separate component

interface EventDetailModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  onDuplicate: (event: CalendarEvent) => void
}

export function EventDetailModal({ event, isOpen, onClose, onSave, onDelete, onDuplicate }: EventDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null)

  if (!event) return null

  const startEditing = () => {
    setEditedEvent({ ...event })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setEditedEvent(null)
    setIsEditing(false)
  }

  const saveChanges = () => {
    if (editedEvent) {
      onSave(editedEvent)
      setIsEditing(false)
      setEditedEvent(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  const currentEvent = editedEvent || event

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MaterialIcon name="event" className="text-2xl text-[#1E40AF]" />
              {isEditing ? "Editar clase" : "Detalles de la clase"}
            </div>
            <Badge variant="secondary" className={cn("text-xs", getStatusColor(currentEvent.estado))}>
              {currentEvent.estado}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Event Header */}
            <div
              className="rounded-xl p-6 border-l-6"
              style={{
                backgroundColor: `${currentEvent.color}10`,
                borderLeftColor: currentEvent.color,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={currentEvent.titulo}
                      onChange={(e) => setEditedEvent((prev) => (prev ? { ...prev, titulo: e.target.value } : null))}
                      className="text-xl font-semibold mb-2"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold text-[#0F172A] mb-2">{currentEvent.titulo}</h2>
                  )}

                  <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                    <div className="flex items-center gap-1">
                      <MaterialIcon name="schedule" className="text-lg" />
                      <span>
                        {formatTime(new Date(currentEvent.fechaInicio))} - {formatTime(new Date(currentEvent.fechaFin))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MaterialIcon name="location_on" className="text-lg" />
                      <span>{currentEvent.pista.nombre}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MaterialIcon name="euro" className="text-lg" />
                      <span>€{currentEvent.precio}</span>
                    </div>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="text-sm"
                  style={{ color: currentEvent.color, borderColor: currentEvent.color }}
                >
                  {currentEvent.tipoClase}
                </Badge>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Fecha y hora</Label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={new Date(currentEvent.fechaInicio).toISOString().split("T")[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value)
                          const currentStart = new Date(currentEvent.fechaInicio)
                          const currentEnd = new Date(currentEvent.fechaFin)
                          const duration = currentEnd.getTime() - currentStart.getTime()

                          newDate.setHours(currentStart.getHours(), currentStart.getMinutes())
                          const newEndDate = new Date(newDate.getTime() + duration)

                          setEditedEvent((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  fechaInicio: newDate.toISOString(),
                                  fechaFin: newEndDate.toISOString(),
                                }
                              : null,
                          )
                        }}
                      />
                      <Input
                        type="time"
                        value={new Date(currentEvent.fechaInicio).toTimeString().slice(0, 5)}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":").map(Number)
                          const newStart = new Date(currentEvent.fechaInicio)
                          const currentEnd = new Date(currentEvent.fechaFin)
                          const duration = currentEnd.getTime() - newStart.getTime()

                          newStart.setHours(hours, minutes)
                          const newEnd = new Date(newStart.getTime() + duration)

                          setEditedEvent((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  fechaInicio: newStart.toISOString(),
                                  fechaFin: newEnd.toISOString(),
                                }
                              : null,
                          )
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-[#0F172A] font-medium">
                      {new Date(currentEvent.fechaInicio).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      de {formatTime(new Date(currentEvent.fechaInicio))} a{" "}
                      {formatTime(new Date(currentEvent.fechaFin))}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Estado</Label>
                  {isEditing ? (
                    <Select
                      value={currentEvent.estado}
                      onValueChange={(value) =>
                        setEditedEvent((prev) => (prev ? { ...prev, estado: value as any } : null))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Confirmada">Confirmada</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                        <SelectItem value="Completada">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary" className={getStatusColor(currentEvent.estado)}>
                      {currentEvent.estado}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Precio</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={currentEvent.precio}
                      onChange={(e) =>
                        setEditedEvent((prev) => (prev ? { ...prev, precio: Number(e.target.value) } : null))
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="text-[#0F172A] font-medium">€{currentEvent.precio}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Instructor</Label>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentEvent.instructor.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-[#1E40AF]/10 text-[#1E40AF]">
                        {getInitials(currentEvent.instructor.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[#0F172A] font-medium">{currentEvent.instructor.nombre}</p>
                      <p className="text-sm text-[#6B7280]">{currentEvent.instructor.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Pista</Label>
                  <p className="text-[#0F172A] font-medium">
                    {currentEvent.pista.nombre} ({currentEvent.pista.tipo})
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Tipo de clase</Label>
                  <Badge variant="outline" style={{ color: currentEvent.color, borderColor: currentEvent.color }}>
                    {currentEvent.tipoClase}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description and Notes */}
            <div className="space-y-4">
              {currentEvent.descripcion && (
                <div>
                  <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Descripción</Label>
                  {isEditing ? (
                    <Textarea
                      value={currentEvent.descripcion}
                      onChange={(e) =>
                        setEditedEvent((prev) => (prev ? { ...prev, descripcion: e.target.value } : null))
                      }
                      rows={3}
                    />
                  ) : (
                    <p className="text-[#0F172A]">{currentEvent.descripcion}</p>
                  )}
                </div>
              )}

              {currentEvent.notas && (
                <div>
                  <Label className="text-sm font-medium text-[#0F172A] mb-2 block">Notas</Label>
                  {isEditing ? (
                    <Textarea
                      value={currentEvent.notas}
                      onChange={(e) => setEditedEvent((prev) => (prev ? { ...prev, notas: e.target.value } : null))}
                      rows={2}
                    />
                  ) : (
                    <p className="text-[#0F172A]">{currentEvent.notas}</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="participants" className="space-y-4 mt-6">
            {currentEvent.cliente && (
              <div className="bg-[#F9FAFB] rounded-lg p-4">
                <h3 className="font-medium text-[#0F172A] mb-3">Cliente</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentEvent.cliente.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-[#1E40AF]/10 text-[#1E40AF]">
                      {getInitials(currentEvent.cliente.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[#0F172A] font-medium">{currentEvent.cliente.nombre}</p>
                    <p className="text-sm text-[#6B7280]">{currentEvent.cliente.email}</p>
                  </div>
                </div>
              </div>
            )}

            {currentEvent.clientes && currentEvent.clientes.length > 0 && (
              <div className="bg-[#F9FAFB] rounded-lg p-4">
                <h3 className="font-medium text-[#0F172A] mb-3">Clientes ({currentEvent.clientes.length})</h3>
                <div className="space-y-3">
                  {currentEvent.clientes.map((cliente) => (
                    <div key={cliente.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={cliente.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-[#1E40AF]/10 text-[#1E40AF] text-xs">
                          {getInitials(cliente.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[#0F172A] font-medium text-sm">{cliente.nombre}</p>
                        <p className="text-xs text-[#6B7280]">{cliente.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            <div className="text-center text-[#6B7280] py-8">
              <MaterialIcon name="history" className="text-4xl mb-2" />
              <p>Historial de cambios próximamente</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-6 border-t border-[#E5E7EB]">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEditing}>
                Cancelar
              </Button>
              <Button onClick={saveChanges} className="bg-[#1E40AF] hover:bg-[#1D4ED8]">
                <MaterialIcon name="save" className="text-lg mr-2" />
                Guardar cambios
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onDuplicate(event)}>
                <MaterialIcon name="content_copy" className="text-lg mr-2" />
                Duplicar
              </Button>
              <Button variant="outline" onClick={() => onDelete(event.id)} className="text-red-600 hover:text-red-700">
                <MaterialIcon name="delete" className="text-lg mr-2" />
                Eliminar
              </Button>
              <Button onClick={startEditing} className="bg-[#1E40AF] hover:bg-[#1D4ED8]">
                <MaterialIcon name="edit" className="text-lg mr-2" />
                Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
