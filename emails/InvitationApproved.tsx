import { Text, Hr, Section } from '@react-email/components'
import EmailLayout from './components/EmailLayout'
import EmailButton from './components/EmailButton'
import type { InvitationApprovedEmailData } from '@/app/types/email'

export default function InvitationApprovedEmail({
  email,
  organizationName,
  role,
  loginLink,
}: InvitationApprovedEmailData) {
  const preview = `¡Tu solicitud para unirte a ${organizationName} ha sido aprobada!`

  return (
    <EmailLayout preview={preview}>
      <Text style={h1}>🎉 ¡Solicitud aprobada!</Text>
      
      <Text style={text}>
        ¡Excelentes noticias, <strong>{email}</strong>!
      </Text>
      
      <Text style={text}>
        Tu solicitud para unirte a <strong>{organizationName}</strong> como{' '}
        <strong>{role}</strong> ha sido <strong>aprobada</strong>.
      </Text>

      {/* Success Card */}
      <Section style={successCard}>
        <Text style={successTitle}>✅ Ya eres parte del equipo</Text>
        <Text style={successText}>
          Ahora tienes acceso completo a {organizationName} y puedes empezar 
          a utilizar todas las funciones disponibles para tu rol.
        </Text>
      </Section>

      <Text style={text}>
        Para empezar, inicia sesión en tu cuenta de ClubOS:
      </Text>

      {/* Call to Action */}
      <Section style={ctaSection}>
        <EmailButton href={loginLink}>
          Iniciar sesión en ClubOS
        </EmailButton>
      </Section>

      <Hr style={divider} />

      {/* Next Steps */}
      <Text style={nextStepsTitle}>📋 Próximos pasos:</Text>
      <Text style={stepsList}>
        <strong>1. Configura tu perfil</strong><br />
        Completa tu información personal y agrega una foto de perfil.
        <br /><br />
        
        <strong>2. Explora el sistema</strong><br />
        Familiarízate con las herramientas disponibles para tu rol como {role}.
        <br /><br />
        
        <strong>3. Conéctate con el equipo</strong><br />
        Conoce a otros miembros de {organizationName} y empieza a colaborar.
      </Text>

      <Hr style={divider} />

      <Text style={supportText}>
        Si tienes alguna pregunta o necesitas ayuda para empezar, no dudes 
        en contactar con soporte en{' '}
        <a href="mailto:soporte@vibato.io" style={linkStyle}>
          soporte@vibato.io
        </a>
      </Text>

      <Text style={signature}>
        ¡Bienvenido a bordo!<br />
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

const successCard = {
  backgroundColor: '#ecfdf5',
  border: '2px solid #10b981',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const successTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#059669',
  margin: '0 0 12px 0',
}

const successText = {
  fontSize: '16px',
  color: '#065f46',
  margin: '0',
  lineHeight: '1.6',
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
  lineHeight: '1.6',
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