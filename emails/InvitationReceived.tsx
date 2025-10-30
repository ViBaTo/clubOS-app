import { Text, Hr } from '@react-email/components'
import EmailLayout from './components/EmailLayout'
import type { InvitationReceivedEmailData } from '@/app/types/email'

export default function InvitationReceivedEmail({
  email,
  organizationName,
  role,
}: InvitationReceivedEmailData) {
  const preview = `Tu solicitud para unirte a ${organizationName} ha sido recibida`

  return (
    <EmailLayout preview={preview}>
      <Text style={h1}>✅ Solicitud de acceso recibida</Text>
      
      <Text style={text}>
        Hola, <strong>{email}</strong>
      </Text>
      
      <Text style={text}>
        Tu solicitud para unirte a <strong>{organizationName}</strong> como{' '}
        <strong>{role}</strong> ha sido recibida correctamente.
      </Text>
      
      <Text style={text}>
        El administrador del club revisará tu solicitud y recibirás un correo 
        electrónico cuando sea aprobada o si necesita más información.
      </Text>

      <Hr style={divider} />

      <Text style={infoBox}>
        <strong>⏱️ ¿Cuánto tiempo toma?</strong><br />
        Este proceso puede tomar hasta 48 horas. Te notificaremos por correo 
        cuando haya novedades sobre tu solicitud.
      </Text>

      <Text style={text}>
        Gracias por tu interés en unirte a {organizationName}.
      </Text>

      <Text style={signature}>
        Saludos,<br />
        El equipo de ClubOS
      </Text>
    </EmailLayout>
  )
}

// Styles
const h1 = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 24px 0',
  lineHeight: '1.3',
}

const text = {
  fontSize: '16px',
  color: '#374151',
  margin: '0 0 16px 0',
  lineHeight: '1.6',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
}

const infoBox = {
  fontSize: '14px',
  color: '#059669',
  backgroundColor: '#ecfdf5',
  border: '1px solid #10b981',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  lineHeight: '1.5',
}

const signature = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '32px 0 0 0',
  lineHeight: '1.5',
}