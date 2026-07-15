import { describe, expect, it, vi } from "vitest";
import { SpoolConnector } from "../src/connectors/spool.js";
import type { Db2Connector } from "../src/connectors/db2.js";

describe("SpoolConnector", () => {
  it("usa SYSTOOLS.SPOOLED_FILE_DATA con argumentos y paginacion", async () => {
    const query = vi.fn().mockResolvedValue([{ ORDINAL_POSITION: 10, SPOOLED_DATA: "LINEA" }]);
    const connector = new SpoolConnector({ query } as unknown as Db2Connector);

    const rows = await connector.get("123456/USR/JOB", "QSYSPRT", 3, 10, 25);
    const [sql, params] = query.mock.calls[0];

    expect(sql).toContain("SYSTOOLS.SPOOLED_FILE_DATA");
    expect(sql).toContain("JOB_NAME => ?");
    expect(sql).toContain("SPOOLED_FILE_NUMBER => ?");
    expect(sql).toContain("FETCH FIRST 25 ROWS ONLY");
    expect(params).toEqual(["123456/USR/JOB", "QSYSPRT", 3, 10]);
    expect(rows).toHaveLength(1);
  });
});
