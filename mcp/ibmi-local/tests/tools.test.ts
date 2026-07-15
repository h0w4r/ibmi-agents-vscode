import { describe, expect, it, vi } from "vitest";
import { registerIbmiTools, type ToolContext } from "../src/tools.js";
import { IbmiAuthenticationError } from "../src/core/errors.js";

describe("registro de tools MCP IBM i", () => {
  it("registra las tools v1 esperadas", () => {
    const names: string[] = [];
    const fakeServer = {
      registerTool(name: string) {
        names.push(name);
      }
    };
    const fakeContext = {} as ToolContext;

    registerIbmiTools(fakeServer, fakeContext);

    expect(names).toEqual(
      expect.arrayContaining([
        "ibmi.profile.check",
        "ibmi.system.capabilities",
        "ibmi.db2.catalog.search",
        "ibmi.db2.object.describe",
        "ibmi.db2.query.readonly",
        "ibmi.joblog.get",
        "ibmi.spool.list",
        "ibmi.spool.get",
        "ibmi.object.info",
        "ibmi.source.member.read",
        "ibmi.compile.plan",
        "ibmi.message.explain",
        "ibmi.message.retrieve",
        "ibmi.system_api.lookup",
        "ibmi.docs.search",
        "ibmi.command.preview",
        "ibmi.command.run_safe"
      ])
    );
  });

  it("devuelve structuredContent en exito y errores MCP tipados sin lanzar fuera del handler", async () => {
    const handlers = new Map<string, (args: unknown) => Promise<any>>();
    const fakeServer = {
      registerTool(
        name: string,
        _config: Record<string, unknown>,
        handler: (args: unknown) => Promise<any>
      ) {
        handlers.set(name, handler);
      }
    };
    const checkProfile = vi
      .fn()
      .mockResolvedValueOnce({ profile: "DEVELOPMENT", host: "ibmi.example.com" })
      .mockRejectedValueOnce(new IbmiAuthenticationError("Password PWD={secreto} rechazada."));
    const fakeContext = { db2: { checkProfile } } as unknown as ToolContext;

    registerIbmiTools(fakeServer, fakeContext);
    const handler = handlers.get("ibmi.profile.check");

    const success = await handler?.({});
    const failure = await handler?.({});
    expect(success.structuredContent.data).toMatchObject({ profile: "DEVELOPMENT" });
    expect(failure).toMatchObject({
      isError: true,
      structuredContent: { error: { code: "IBMI_AUTHENTICATION_FAILED", retryable: false } }
    });
    expect(JSON.stringify(failure)).not.toContain("secreto");
  });
});
