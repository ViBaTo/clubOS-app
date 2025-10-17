"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClientAvatar } from "@/components/ui/client-avatar"
import { getSupabaseClient } from "@/src/lib/supabaseClient"

interface Client {
  id: string
  full_name: string
  email?: string
  phone?: string
  status?: string
}

interface AssignClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productName: string
  onAssigned?: () => void
}

export function AssignClientModal({ open, onOpenChange, productId, productName, onAssigned }: AssignClientModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadClients()
      setSearchQuery("")
      setSelectedClientId(null)
    }
  }, [open])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredClients(
        clients.filter(c => 
          c.full_name.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query)
        )
      )
    } else {
      setFilteredClients(clients)
    }
  }, [searchQuery, clients])

  const loadClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      // Get all clients
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      
      const res = await fetch('/api/clients', { headers })
      const json = await res.json()
      
      if (!res.ok) throw new Error(json.error || 'Error loading clients')
      
      // Get clients already enrolled in this product
      const { data: enrolledClients } = await supabase
        .from('product_sales')
        .select('client_id')
        .eq('product_id', productId)
        .eq('status', 'active')

      const enrolledClientIds = new Set(enrolledClients?.map(e => e.client_id) || [])
      
      // Filter: active clients who are NOT already enrolled
      const availableClients = (json.clients || []).filter((c: Client) => 
        (c.status === 'active' || c.status === 'activo') && !enrolledClientIds.has(c.id)
      )
      
      setClients(availableClients)
      setFilteredClients(availableClients)
    } catch (e: any) {
      console.error('Error loading clients:', e)
      setError(e.message || 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedClientId) return
    
    setAssigning(true)
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      // Create a product sale (enrollment)
      const { data: product } = await supabase.from('products').select('price, organization_id').eq('id', productId).single()
      
      const payload = {
        client_id: selectedClientId,
        product_id: productId,
        quantity: 1,
        unit_price: product?.price || 0,
        total_price: product?.price || 0,
        status: 'active',
        organization_id: product?.organization_id
      }

      const res = await fetch('/api/products/enroll', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Error al asignar cliente')

      onAssigned?.()
      onOpenChange(false)
    } catch (e: any) {
      console.error('Error assigning client:', e)
      alert(e.message || 'Error al asignar cliente')
    } finally {
      setAssigning(false)
    }
  }

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0] || fullName
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Asignar cliente a {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div>
            <Input
              placeholder="Buscar cliente por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Client list */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={loadClients}>Reintentar</Button>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-[#64748B]">Cargando clientes...</div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center text-[#64748B]">
                {searchQuery ? 'No se encontraron clientes' : 'No hay clientes activos'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 hover:bg-[#F8FAFC] cursor-pointer transition-colors ${
                      selectedClientId === client.id ? 'bg-blue-50 border-l-4 border-[#1E40AF]' : ''
                    }`}
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <div className="flex items-center gap-3">
                      <ClientAvatar 
                        firstName={getFirstName(client.full_name)} 
                        imageUrl={null}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-[#0F172A]">{client.full_name}</p>
                        <div className="flex gap-4 text-sm text-[#64748B]">
                          {client.email && <span>{client.email}</span>}
                          {client.phone && <span>{client.phone}</span>}
                        </div>
                      </div>
                      {selectedClientId === client.id && (
                        <span className="material-symbols-outlined text-[#1E40AF]">check_circle</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedClientId || assigning}
            className="bg-[#1E40AF] hover:bg-[#1D4ED8]"
          >
            {assigning ? 'Asignando...' : 'Asignar cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

