import { assertSafeCommand, previewCommand } from "../core/commandSafety.js";
import { writeAuditEvent } from "../core/audit.js";
import type { IbmiConfig } from "../config.js";
import type { Db2Connector } from "./db2.js";

export class CommandConnector {
  constructor(
    private readonly config: IbmiConfig,
    private readonly db2: Db2Connector
  ) {}

  async preview(command: string): Promise<unknown> {
    const result = previewCommand(command);
    await writeAuditEvent(this.config.auditLog, {
      action: "ibmi.command.preview",
      status: "preview",
      detail: result
    });
    return result;
  }

  async runSafe(command: string): Promise<unknown> {
    const safe = assertSafeCommand(command);
    await writeAuditEvent(this.config.auditLog, {
      action: "ibmi.command.run_safe",
      status: "allowed",
      detail: { verb: safe.verb, command: safe.command }
    });

    // QSYS2.QCMDEXC ejecuta el comando CL; la allowlist evita comandos mutantes en v1.
    await this.db2.query("CALL QSYS2.QCMDEXC(?)", [safe.command]);

    return {
      executed: true,
      verb: safe.verb,
      command: safe.command,
      note: "Comando seguro enviado a IBM i. Si genero salida spool, consulte ibmi.spool.list."
    };
  }
}
