# Configuración MCP para Conectar Claude Code a Replit

## 📋 ¿Qué es MCP y por qué lo necesitas?

**Model Context Protocol (MCP)** es un estándar abierto desarrollado por Anthropic que permite a Claude Code conectarse directamente a:
- Servidores remotos (como Replit)
- Bases de datos
- APIs
- Sistemas de archivos remotos
- Y mucho más

**Beneficio para ti:** Claude Code podrá ejecutar comandos, leer/escribir archivos, y hacer debugging directamente en tu Replit sin que tengas que copiar/pegar comandos constantemente.

---

## 🎯 Opciones para Conectar Claude Code a Replit

### Opción 1: SSH MCP Server (RECOMENDADO ✅)

#### Servidores MCP Disponibles:

1. **adremote-mcp** (Más completo)
   - GitHub: https://github.com/nqmn/adremote-mcp
   - Soporta: SSH, SFTP, ejecución de comandos
   - Lenguaje: Python

2. **SSH-MCP** (Alternativa)
   - GitHub: https://github.com/mixelpixx/SSH-MCP
   - Soporta: Conexiones SSH seguras con autenticación por clave
   - Lenguaje: TypeScript

3. **code-mcp** (Específico para desarrollo)
   - GitHub: https://github.com/54yyyu/code-mcp
   - Soporta: Terminal + operaciones de archivos
   - Auto-instalación en servidor remoto

---

## 🚀 Guía de Instalación (adremote-mcp)

### Requisitos Previos:

1. **Replit debe tener un plan de pago** (Core, Teams, etc.) para acceso SSH
2. Python 3.7+ instalado localmente
3. Claude Code instalado
4. Acceso SSH a tu Replit

---

### Paso 1: Verificar que Replit Tiene SSH Habilitado

En tu proyecto de Replit:

1. Ve a la terminal de Replit
2. Ejecuta: `echo $REPL_OWNER` y `echo $REPL_SLUG`
3. La URL SSH será algo como: `ssh [REPL_OWNER]-[REPL_SLUG]@ssh.replit.com`

**Ejemplo:**
```bash
ssh ramautos1-whatsapp-cloude@ssh.replit.com
```

---

### Paso 2: Instalar adremote-mcp Localmente (en tu Mac)

```bash
# 1. Clonar el repositorio
cd ~/Desktop
git clone https://github.com/nqmn/adremote-mcp.git
cd adremote-mcp

# 2. Instalar dependencias
pip3 install -r requirements.txt

# 3. Verificar ruta absoluta
pwd
# Output ejemplo: /Users/rayalvarado/Desktop/adremote-mcp
```

---

### Paso 3: Configurar Claude Code

#### Para Claude Code CLI:

**Archivo de configuración:** `~/.config/claude-code/config.json`

```json
{
  "mcpServers": {
    "replit-ssh": {
      "command": "python3",
      "args": [
        "/Users/rayalvarado/Desktop/adremote-mcp/ssh_mcp_server.py"
      ],
      "env": {
        "SSH_HOST": "ssh.replit.com",
        "SSH_USERNAME": "ramautos1-whatsapp-cloude",
        "SSH_PORT": "22"
      }
    }
  }
}
```

**Nota:** Reemplaza `/Users/rayalvarado/Desktop/adremote-mcp/ssh_mcp_server.py` con la ruta real en tu sistema.

#### Para Claude Desktop (si lo usas):

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "replit-ssh": {
      "command": "python3",
      "args": [
        "/Users/rayalvarado/Desktop/adremote-mcp/ssh_mcp_server.py"
      ]
    }
  }
}
```

---

### Paso 4: Obtener Credenciales SSH de Replit

Replit usa autenticación por contraseña temporal. Para obtenerla:

1. Ve a tu proyecto en Replit
2. Click en el ícono de **Shell** (terminal)
3. Ejecuta: `ssh-keygen -t rsa` (si no tienes clave SSH)
4. O usa autenticación por contraseña de Replit (te la dan en el dashboard)

**Alternativa:** Configurar SSH key:

```bash
# En tu Mac, generar clave si no tienes
ssh-keygen -t rsa -b 4096 -C "tu_email@ejemplo.com"

# Copiar clave pública
cat ~/.ssh/id_rsa.pub

# En Replit, agregar clave pública a ~/.ssh/authorized_keys
```

---

### Paso 5: Probar Conexión Manual (Antes de MCP)

```bash
# Probar conexión SSH manual primero
ssh ramautos1-whatsapp-cloude@ssh.replit.com

# Si pide contraseña, ingrésala
# Si funciona, verás la terminal de Replit
```

---

### Paso 6: Usar MCP Server desde Claude Code

Una vez configurado, reinicia Claude Code y prueba:

```
Claude Code: "Conecta a mi servidor Replit con el usuario ramautos1-whatsapp-cloude y contraseña [tu_contraseña]"
```

Luego puedes pedirle:

```
Claude Code: "Lista los archivos en /home/runner/workspace"
Claude Code: "Muéstrame los logs del servidor en tiempo real"
Claude Code: "Ejecuta npm run dev y muéstrame la salida"
```

---

## ⚠️ Limitaciones Conocidas

1. **Autenticación OAuth no funciona en SSH remoto** - Necesitas usar contraseña o SSH keys
2. **Replit SSH requiere plan de pago** - No funciona en plan gratuito
3. **Puede haber latencia** - Dependiendo de tu conexión

---

## 🔐 Seguridad

### Buenas Prácticas:

1. **NUNCA** pongas contraseñas en el archivo de configuración
2. Usa SSH keys en lugar de contraseñas cuando sea posible
3. Configura timeout para conexiones
4. Usa variables de entorno para credenciales sensibles

**Ejemplo seguro:**

```json
{
  "mcpServers": {
    "replit-ssh": {
      "command": "python3",
      "args": [
        "/Users/rayalvarado/Desktop/adremote-mcp/ssh_mcp_server.py"
      ],
      "env": {
        "SSH_HOST": "ssh.replit.com",
        "SSH_USERNAME": "ramautos1-whatsapp-cloude",
        "SSH_KEY_PATH": "~/.ssh/id_rsa"
      }
    }
  }
}
```

---

## 🎯 Casos de Uso

Con MCP configurado, Claude Code podrá:

### ✅ Debugging Remoto:
```
"Revisa los logs de producción en Replit y dime si hay errores"
```

### ✅ Deploy Automático:
```
"Haz git pull en Replit y reinicia el servidor"
```

### ✅ Monitoring:
```
"Muéstrame el uso de memoria y CPU en el servidor"
```

### ✅ File Operations:
```
"Sube este archivo local a /home/runner/workspace/uploads/"
```

### ✅ Database Queries:
```
"Conéctate a la DB en Replit y muéstrame las últimas 10 subcuentas creadas"
```

---

## 📊 Alternativa: Opción 2 - SSH-MCP (TypeScript)

Si prefieres TypeScript sobre Python:

```bash
# 1. Clonar
git clone https://github.com/mixelpixx/SSH-MCP.git
cd SSH-MCP

# 2. Instalar
npm install

# 3. Build
npm run build

# 4. Configurar Claude Code
```

**Config:**
```json
{
  "mcpServers": {
    "ssh-mcp": {
      "command": "node",
      "args": [
        "/ruta/a/SSH-MCP/dist/index.js"
      ]
    }
  }
}
```

---

## 📊 Alternativa: Opción 3 - code-mcp (Auto-instalación)

Este MCP se instala automáticamente en el servidor remoto:

```bash
# 1. Instalar localmente
npm install -g code-mcp

# 2. Configurar Claude Desktop
```

**Config:**
```json
{
  "mcpServers": {
    "code-mcp-remote": {
      "command": "code-mcp-remote",
      "args": [
        "--host", "ssh.replit.com",
        "--user", "ramautos1-whatsapp-cloude",
        "--key", "~/.ssh/id_rsa"
      ]
    }
  }
}
```

**Ventaja:** Se instala automáticamente en Replit al conectar por primera vez.

---

## 🧪 Probar que Funciona

Después de configurar:

1. **Reinicia Claude Code** completamente
2. Inicia una nueva conversación
3. Pide: "Lista los archivos en mi servidor Replit"
4. Si funciona, deberías ver la lista de archivos

**Debugging:**

Si no funciona:
```bash
# Ver logs de MCP
tail -f ~/.config/claude-code/logs/mcp-*.log

# Probar script manualmente
python3 /ruta/a/ssh_mcp_server.py
```

---

## 🎯 Recomendación Final

**Para ti (Ray), recomiendo:**

1. ✅ **Usar adremote-mcp** (Python)
   - Es el más completo
   - Fácil de debuggear
   - Soporta SFTP para transferir archivos

2. ✅ **Configurar SSH keys** en lugar de contraseñas
   - Más seguro
   - No expiras sesiones

3. ✅ **Probar primero con conexión SSH manual**
   - Asegúrate que SSH funciona antes de configurar MCP

---

## 📚 Recursos Adicionales

- **MCP Docs:** https://modelcontextprotocol.io/
- **Replit SSH Docs:** https://docs.replit.com/replit-workspace/ssh
- **adremote-mcp:** https://github.com/nqmn/adremote-mcp
- **Claude Code MCP Guide:** https://docs.anthropic.com/claude/docs/model-context-protocol

---

## ⚡ Próximos Pasos

1. Verificar que tienes plan de pago en Replit (para SSH)
2. Clonar adremote-mcp en tu Mac
3. Configurar Claude Code con la ruta correcta
4. Probar conexión SSH manual
5. Configurar MCP
6. ¡Disfrutar de control total desde Claude Code!

---

**Fecha:** 1 de Noviembre, 2025
**Creado por:** Claude Code
**Para:** Ray Alvarado - Proyecto EvolutionGHLConnect
