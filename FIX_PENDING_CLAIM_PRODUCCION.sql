-- Crear o activar la empresa PENDING_CLAIM en PRODUCCIÓN
-- NOTA: NO incluir 'plan' porque esa columna NO existe en la tabla companies

INSERT INTO companies (
  id, 
  name, 
  email,
  is_active, 
  created_at, 
  updated_at
) 
VALUES (
  'PENDING_CLAIM',
  'Pending Claim',
  'pending@system.internal',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- Verificar que se creó correctamente
SELECT id, name, email, is_active, created_at 
FROM companies 
WHERE id = 'PENDING_CLAIM';
