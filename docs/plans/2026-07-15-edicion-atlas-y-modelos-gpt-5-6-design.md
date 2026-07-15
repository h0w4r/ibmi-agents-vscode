# Diseno: IBM i Atlas Y Modelos GPT-5.6

Fecha: 15/07/2026

## Objetivo

Permitir que IBM i Senior y una edicion completamente independiente de MCP convivan en el mismo ordenador y perfil VS Code, sin presentar la segunda como una version reducida. Asignar GPT-5.6 Sol al orquestador y GPT-5.6 Terra a los subagentes para controlar costo.

## Identidad

La segunda edicion se denomina **IBM i Atlas**:

- Orquestador: `ibmi-atlas`.
- Subagentes: `ibmi-atlas-analista`, `ibmi-atlas-desarrollador`, `ibmi-atlas-diagnostico`, `ibmi-atlas-operaciones`, `ibmi-atlas-qa`.
- Prompts: prefijo `atlas-`.
- Instalacion: `%LOCALAPPDATA%\ibmi-atlas-agent`.
- Mensajes visibles: describen analisis, desarrollo, diagnostico y QA; no usan lenguaje de escasez.

## Independencia

Atlas no copia el servidor, no ejecuta Node/npm, no requiere ODBC, no modifica `mcp.json`, no solicita credenciales y no declara herramientas `ibmi-local/*`. Trabaja con fuentes y evidencia disponible en VS Code. Cuando falte informacion, solicita un artefacto concreto en lugar de simular datos remotos.

## Convivencia

- Agentes, handoffs, prompts, manifiestos, backups y raices de runtime son distintos.
- Las 14 skills son neutrales y compartidas para evitar duplicacion en el selector dinamico.
- Al desinstalar una edicion, las skills se conservan si el otro orquestador sigue presente.
- Instalar o actualizar Atlas no toca la configuracion de IBM i Senior.

## Modelos

- Orquestadores: `GPT-5.6 Sol (copilot)`.
- Subagentes: `GPT-5.6 Terra (copilot)`.
- Subagentes: `user-invocable: false` para mantener el flujo de delegacion.
- Thinking Effort: `Extra High` recomendado.

VS Code documenta `model` en el frontmatter, pero Thinking Effort se selecciona en el model picker y se recuerda por sesion. No se agrega una propiedad no soportada para simular que Extra High queda impuesto.

## Criterios De Aceptacion

1. Ambas ediciones se instalan simultaneamente en un perfil temporal.
2. Existen 12 agentes, 28 prompts y 14 skills compartidas.
3. Atlas no contiene referencias MCP ni instala runtime auxiliar.
4. Instalar Atlas conserva el registro de IBM i Senior.
5. Desinstalar una edicion no elimina agentes, prompts o skills requeridos por la otra.
6. Los validadores rechazan modelos incorrectos o dependencias introducidas en Atlas.
