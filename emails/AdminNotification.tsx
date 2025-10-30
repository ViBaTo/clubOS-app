import { Text, Hr, Section } from '@react-email/components'
import EmailLayout from './components/EmailLayout'
import EmailButton from './components/EmailButton'
import type { AdminNotificationEmailData } from '@/app/types/email'

export default function AdminNotificationEmail({
  adminEmail,
  applicantName,
  applicantEmail,
  role,
  message,
  organizationName,
  approvalLink,
}: AdminNotificationEmailData) {
  const preview = `Nueva solicitud de acceso de ${applicantName} para ${organizationName}`

  return (
    <EmailLayout preview={preview}>
      <Text style={h1}>🔔 Nueva solicitud de acceso</Text>
      
      <Text style={text}>
        Hola,
      </Text>
      
      <Text style={text}>
        Has recibido una nueva solicitud de acceso para <strong>{organizationName}</strong>.
      </Text>

      {/* Applicant Details */}
      <Section style={applicantCard}>
        <Text style={cardTitle}>👤 Detalles del solicitante</Text>
        <Text style={cardText}>
          <strong>Nombre:</strong> {applicantName}
        </Text>
        <Text style={cardText}>
          <strong>Email:</strong> {applicantEmail}
        </Text>
        <Text style={cardText}>
          <strong>Rol solicitado:</strong> {role}
        </Text>
        {message && (
          <>
            <Text style={cardText}>
              <strong>Mensaje:</strong>
            </Text>
            <Text style={messageText}>
              "{message}"
            </Text>
          </>
        )}
      </Section>

      <Text style={text}>
        Por favor, revisa esta solicitud y toma una decisión. El solicitante 
        será notificado automáticamente cuando apruebes o rechaces su solicitud.
      </Text>

      {/* Call to Action */}
      <Section style={ctaSection}>
        <EmailButton href={approvalLink}>
          Revisar solicitud
        </EmailButton>
      </Section>

      <Hr style={divider} />

      <Text style={helpText}>
        💡 <strong>Consejos:</strong><br />
        • Verifica que el solicitante tenga una razón válida para unirse<br />
        • Considera el rol que está solicitando y si es apropiado<br />
        • Si tienes dudas, puedes contactar al solicitante directamente
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

const applicantCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const cardTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px 0',
}

const cardText = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 8px 0',
  lineHeight: '1.5',
}

const messageText = {
  fontSize: '14px',
  color: '#6b7280',
  fontStyle: 'italic',
  margin: '8px 0 0 0',
  padding: '12px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  lineHeight: '1.5',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
}

const helpText = {
  fontSize: '14px',
  color: '#6b7280',
  backgroundColor: '#fffbeb',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  lineHeight: '1.6',
}

const signature = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '32px 0 0 0',
  lineHeight: '1.5',
}