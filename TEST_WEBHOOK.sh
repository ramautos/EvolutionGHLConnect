#!/bin/bash

# Script para probar el webhook de registro de subcuentas
# Simula el webhook que n8n envía después de OAuth de GoHighLevel

echo "🧪 Probando webhook de registro de subcuenta..."
echo ""

# URL del webhook
WEBHOOK_URL="https://whatsapp.cloude.es/api/webhooks/register-subaccount"

# Datos de prueba (ejemplo con los datos de la base de datos GHL)
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coordinacion@llantas777.com",
    "name": "DonCesar",
    "phone": "+18095551234",
    "locationId": "jA1R34Qe18U0KjHu6Vvu",
    "locationName": "Llantas 777",
    "ghlCompanyId": "test-company-123",
    "companyName": "Test Company Name"
  }'

echo ""
echo ""
echo "✅ Webhook enviado!"
echo ""
echo "📋 Respuesta esperada:"
echo "  - success: true"
echo "  - message: 'Subaccount created - pending claim'"
echo "  - requiresClaim: true"
echo "  - companyId: null"
echo ""
echo "🔗 Siguiente paso:"
echo "  1. n8n debe redirigir el navegador a:"
echo "     https://whatsapp.cloude.es/claim-subaccount?locationId=jA1R34Qe18U0KjHu6Vvu"
echo ""
echo "  2. El usuario autenticado reclamará automáticamente la subcuenta"
echo "  3. La subcuenta se asociará con la empresa del usuario"
echo "  4. Se creará la instancia de WhatsApp"
