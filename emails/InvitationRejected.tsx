import { Text, Hr, Section } from '@react-email/components'
import EmailLayout from './components/EmailLayout'
import EmailButton from './components/EmailButton'
import type { InvitationRejectedEmailData } from '@/app/types/email'

export default function InvitationRejectedEmail({
  email,
  organizationName,
  reason,
}: InvitationRejectedEmailData) {
  const preview = `Actualización sobre tu solicitud de acceso a ${organizationName}`

  return (
    <EmailLayout preview={preview}>
      <Text style={h1}>📋 Actualización de tu solicitud</Text>
      
      <Text style={text}>
        Hola, <strong>{email}</strong>
      </Text>
      
      <Text style={text}>
        Te escribimos para informarte sobre el estado de tu solicitud 
        para unirte a <strong>{organizationName}</strong>.
      </Text>

      {/* Status Card */}
      <Section style={statusCard}>
        <Text style={statusTitle}>❌ Solicitud no aprobada</Text>
        <Text style={statusText}>
          Después de revisar tu solicitud, el administrador ha decidido 
          no aprobar tu acceso en este momento.
        </Text>
      </Section>

      {/* Reason (if provided) */}
      {reason && (
        <>
          <Text style={reasonTitle}>💬 Motivo proporcionado:</Text>
          <Section style={reasonCard}>
            <Text style={reasonText}>
              "{reason}"
            </Text>
          </Section>
        </>
      )}

      <Text style={text}>
        Entendemos que esta noticia puede ser decepcionante. Sin embargo, 
        esto no significa que no puedas intentarlo de nuevo en el futuro 
        o explorar otras oportunidades.
      </Text>

      <Hr style={divider} />

      {/* Next Steps */}
      <Text style={nextStepsTitle}>🔄 ¿Qué puedes hacer ahora?</Text>
      <Text style={stepsList}>
        <strong>• Contacta directamente:</strong><br />
        Si tienes preguntas específicas, considera contactar directamente 
        con el administrador de {organizationName}.
        <br /><br />
        
        <strong>• Solicita feedback:</strong><br />
        Pregunta qué puedes mejorar para futuras aplicaciones.
        <br /><br />
        
        <strong>• Intenta más tarde:</strong><br />
        Las circunstancias pueden cambiar, y podrías aplicar nuevamente 
        en el futuro.
        <br /><br />
        
        <strong>• Explora otras opciones:</strong><br />
        Considera buscar otras organizaciones que puedan ser un buen 
        ajuste para tus intereses y objetivos.
      </Text>

      <Hr style={divider} />

      <Text style={supportText}>
        Si tienes alguna pregunta sobre este proceso o necesitas ayuda 
        con ClubOS, nuestro equipo de soporte está disponible en{' '}
        <a href="mailto:soporte@vibato.io" style={linkStyle}>
          soporte@vibato.io
        </a>
      </Text>

      <Text style={signature}>
        Gracias por tu interés,<br />
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

const statusCard = {
  backgroundColor: '#fef2f2',
  border: '2px solid #f87171',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const statusTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '0 0 12px 0',
}

const statusText = {
  fontSize: '16px',
  color: '#991b1b',
  margin: '0',
  lineHeight: '1.6',
}

const reasonTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '24px 0 12px 0',
}

const reasonCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 24px 0',
}

const reasonText = {
  fontSize: '15px',
  color: '#374151',
  fontStyle: 'italic',
  margin: '0',
  lineHeight: '1.6',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
}

const nextStepsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px 0',
}

const stepsList = {
  fontSize: '14px',
  color: '#374151',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 24px 0',
  lineHeight: '1.7',
}

const supportText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 16px 0',
  lineHeight: '1.5',
}

const linkStyle = {
  color: '#1d4ed8',
  textDecoration: 'underline',
}

const signature = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '32px 0 0 0',
  lineHeight: '1.5',
}