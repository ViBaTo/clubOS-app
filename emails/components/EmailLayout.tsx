import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img
} from '@react-email/components'
import { ReactNode } from 'react'

interface EmailLayoutProps {
  children: ReactNode
  preview?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.clubos.com'

export default function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head>
        {preview && <meta name="description" content={preview} />}
      </Head>
      <Body style={main}>
        <Container style={container}>
          {/* Brand Header */}
          <Section style={brand}>
            <Text style={brandTitle}>ClubOS</Text>
            <Text style={brandSubtitle}>Gestión inteligente de clubes deportivos</Text>
          </Section>

          {/* Main Content */}
          <Section style={card}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerText}>
              © 2024 ClubOS · Gestión inteligente de clubes deportivos
            </Text>
            <Text style={footerSubText}>
              Este correo fue enviado desde ClubOS. Si tienes alguna pregunta, 
              contacta con soporte en soporte@vibato.io
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Shared styles following ClubOS design system
const main = {
  backgroundColor: '#f6f8fb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#1f2937',
  padding: '20px 0',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: 'transparent',
}

const brand = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const brandTitle = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1d4ed8',
  margin: '0',
  letterSpacing: '-0.5px',
}

const brandSubtitle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '4px 0 0 0',
  fontWeight: 'normal',
}

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '40px 32px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  marginBottom: '24px',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
}

const footerDivider = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0 24px 0',
}

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 8px 0',
}

const footerSubText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
  lineHeight: '1.5',
}