import type { Db2Connector } from "./db2.js";

export class SpoolConnector {
  constructor(private readonly db2: Db2Connector) {}

  async list(jobName?: string, userName?: string): Promise<Record<string, unknown>[]> {
    const filters: string[] = [];
    const params: unknown[] = [];

    if (jobName) {
      filters.push("JOB_NAME = ?");
      params.push(jobName.toUpperCase());
    }

    if (userName) {
      filters.push("USER_NAME = ?");
      params.push(userName.toUpperCase());
    }

    const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    return this.db2.queryReadonly(
      `SELECT JOB_NAME, USER_NAME, JOB_NUMBER, SPOOLED_FILE_NAME, SPOOLED_FILE_NUMBER, OUTPUT_QUEUE_LIBRARY, OUTPUT_QUEUE_NAME, CREATE_TIMESTAMP FROM QSYS2.OUTPUT_QUEUE_ENTRIES${where} ORDER BY CREATE_TIMESTAMP DESC`,
      params
    );
  }

  async get(
    jobName: string,
    spooledFileName: string,
    spooledFileNumber?: number,
    startLine = 1,
    maxLines = 200
  ): Promise<Record<string, unknown>[]> {
    if (!Number.isInteger(startLine) || startLine < 1) {
      throw new Error("startLine debe ser un entero mayor o igual a 1.");
    }
    if (!Number.isInteger(maxLines) || maxLines < 1 || maxLines > 1000) {
      throw new Error("maxLines debe ser un entero entre 1 y 1000.");
    }

    const numberArgument = spooledFileNumber === undefined ? "" : ", SPOOLED_FILE_NUMBER => ?";
    const params: unknown[] = [jobName.toUpperCase(), spooledFileName.toUpperCase()];
    if (spooledFileNumber !== undefined) {
      params.push(spooledFileNumber);
    }
    params.push(startLine);

    // SYSTOOLS.SPOOLED_FILE_DATA recibe la identidad del spool como argumentos, no como columnas WHERE.
    return this.db2.query(
      `SELECT ORDINAL_POSITION, SPOOLED_DATA
         FROM TABLE(SYSTOOLS.SPOOLED_FILE_DATA(
           JOB_NAME => ?, SPOOLED_FILE_NAME => ?${numberArgument}, IGNORE_ERRORS => 'NO'
         ))
        WHERE ORDINAL_POSITION >= ?
        ORDER BY ORDINAL_POSITION
        FETCH FIRST ${maxLines} ROWS ONLY`,
      params
    );
  }
}
