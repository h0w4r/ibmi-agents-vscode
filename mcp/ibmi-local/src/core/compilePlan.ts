export type CompileLanguage =
  | "RPGLE"
  | "RPGMOD"
  | "SQLRPGLE"
  | "SQLRPGMOD"
  | "CLLE"
  | "DSPF"
  | "PF"
  | "LF"
  | "CMD"
  | "PGM"
  | "SRVPGM";

export interface CompilePlanInput {
  language: CompileLanguage;
  library: string;
  object: string;
  sourceFile?: string;
  sourceMember?: string;
  sourceLibrary?: string;
  debugView?: "*SOURCE" | "*LIST" | "*STMT" | "*ALL" | "*NONE";
  commit?: "*NONE" | "*CHG" | "*CS" | "*ALL" | "*RR";
  targetRelease?: "*CURRENT" | "*PRV";
  activationGroup?: "*NEW" | "*CALLER" | "*ENTMOD" | string;
  bindingDirectories?: string[];
  modules?: string[];
  program?: string;
  rpgPreprocessor?: "*NONE" | "*LVL1" | "*LVL2";
}

export interface CompilePlan {
  language: CompileLanguage;
  command: string;
  executed: false;
  prerequisites: string[];
  notes: string[];
}

const SYSTEM_NAME_PATTERN = /^[A-Z#$@][A-Z0-9_$#@]{0,9}$/;

// Los comandos se generan para nombres de sistema IBM i no entrecomillados.
export function assertSystemName(value: string, field: string): string {
  const normalized = value.trim().toUpperCase();
  if (!SYSTEM_NAME_PATTERN.test(normalized)) {
    throw new Error(
      `${field} debe ser un nombre de sistema IBM i de 1 a 10 caracteres; ` +
        "debe iniciar con A-Z, #, $ o @ y no puede contener espacios ni sintaxis CL."
    );
  }
  return normalized;
}

function qualifiedName(value: string, defaultLibrary: string, field: string): string {
  const parts = value.trim().split("/");
  if (parts.length === 1) {
    return `${defaultLibrary}/${assertSystemName(parts[0], field)}`;
  }
  if (parts.length !== 2) {
    throw new Error(`${field} debe usar OBJETO o BIBLIOTECA/OBJETO.`);
  }
  return `${assertSystemName(parts[0], `${field}.library`)}/${assertSystemName(parts[1], field)}`;
}

function sourceArguments(input: CompilePlanInput, targetLibrary: string): string {
  if (!input.sourceFile || !input.sourceMember) {
    throw new Error(`${input.language} requiere sourceFile y sourceMember.`);
  }
  const sourceLibrary = assertSystemName(input.sourceLibrary ?? targetLibrary, "sourceLibrary");
  const sourceFile = assertSystemName(input.sourceFile, "sourceFile");
  const sourceMember = assertSystemName(input.sourceMember, "sourceMember");
  return `SRCFILE(${sourceLibrary}/${sourceFile}) SRCMBR(${sourceMember})`;
}

function activationGroup(value: string | undefined, fallback: string): string {
  const candidate = (value ?? fallback).trim().toUpperCase();
  if (["*NEW", "*CALLER", "*ENTMOD"].includes(candidate)) {
    return candidate;
  }
  return assertSystemName(candidate, "activationGroup");
}

function listParameter(
  values: string[] | undefined,
  defaultLibrary: string,
  field: string,
  minimum = 0
): string | undefined {
  if (!values || values.length < minimum) {
    if (minimum > 0) {
      throw new Error(`${field} requiere al menos ${minimum} elemento.`);
    }
    return undefined;
  }
  return values.map((value) => qualifiedName(value, defaultLibrary, field)).join(" ");
}

export function buildCompilePlan(input: CompilePlanInput): CompilePlan {
  const library = assertSystemName(input.library, "library");
  const object = assertSystemName(input.object, "object");
  const debugView = input.debugView ?? "*SOURCE";
  const targetRelease = input.targetRelease ?? "*CURRENT";
  const source = () => sourceArguments(input, library);
  const baseNotes = ["Plan solamente informativo: el MCP no ejecuta compilaciones."];

  switch (input.language) {
    case "SQLRPGLE":
    case "SQLRPGMOD": {
      const objectType = input.language === "SQLRPGLE" ? "*PGM" : "*MODULE";
      const commit = input.commit ?? "*NONE";
      const rpgPreprocessor = input.rpgPreprocessor ?? "*NONE";
      const actgrp =
        input.language === "SQLRPGLE"
          ? ` ACTGRP(${activationGroup(input.activationGroup, "*NEW")})`
          : "";
      return {
        language: input.language,
        command:
          `CRTSQLRPGI OBJ(${library}/${object}) OBJTYPE(${objectType}) ${source()} ` +
          `COMMIT(${commit}) DBGVIEW(${debugView}) TGTRLS(${targetRelease}) ` +
          `RPGPPOPT(${rpgPreprocessor})${actgrp}`,
        executed: false,
        prerequisites: ["Precompilador IBM SQL instalado y bibliotecas referenciadas disponibles."],
        notes: [
          ...baseNotes,
          "Use RPGPPOPT(*LVL1|*LVL2) solo si el precompilador debe procesar /COPY o /INCLUDE.",
          "Valide COMMIT, CLOSQLCSR y la convencion de nombres SQL/SYS antes de compilar."
        ]
      };
    }

    case "RPGLE": {
      const bnddir = listParameter(input.bindingDirectories, library, "bindingDirectories");
      return {
        language: input.language,
        command:
          `CRTBNDRPG PGM(${library}/${object}) ${source()} DBGVIEW(${debugView}) ` +
          `TGTRLS(${targetRelease}) ACTGRP(${activationGroup(input.activationGroup, "*NEW")})` +
          (bnddir ? ` BNDDIR(${bnddir})` : ""),
        executed: false,
        prerequisites: bnddir ? ["Binding directories y service programs referenciados disponibles."] : [],
        notes: [
          ...baseNotes,
          "Use RPGMOD + PGM si el despliegue requiere modulos ILE separados.",
          "Revise OPTION(*EVENTF) si necesita diagnosticos consumibles por herramientas."
        ]
      };
    }

    case "RPGMOD":
      return {
        language: input.language,
        command:
          `CRTRPGMOD MODULE(${library}/${object}) ${source()} DBGVIEW(${debugView}) ` +
          `TGTRLS(${targetRelease})`,
        executed: false,
        prerequisites: [],
        notes: [...baseNotes, "Vincule despues el modulo mediante CRTPGM o CRTSRVPGM."]
      };

    case "PGM": {
      const modules = listParameter(input.modules, library, "modules", 1);
      const bnddir = listParameter(input.bindingDirectories, library, "bindingDirectories");
      return {
        language: input.language,
        command:
          `CRTPGM PGM(${library}/${object}) MODULE(${modules}) ` +
          `ACTGRP(${activationGroup(input.activationGroup, "*ENTMOD")})` +
          (bnddir ? ` BNDDIR(${bnddir})` : ""),
        executed: false,
        prerequisites: ["Todos los modulos y dependencias de binding deben existir."],
        notes: [...baseNotes, "Confirme el entry module y la firma de procedimientos exportados/importados."]
      };
    }

    case "SRVPGM": {
      const modules = listParameter(input.modules, library, "modules", 1);
      const bnddir = listParameter(input.bindingDirectories, library, "bindingDirectories");
      return {
        language: input.language,
        command:
          `CRTSRVPGM SRVPGM(${library}/${object}) MODULE(${modules}) EXPORT(*ALL) ` +
          `ACTGRP(${activationGroup(input.activationGroup, "*CALLER")})` +
          (bnddir ? ` BNDDIR(${bnddir})` : ""),
        executed: false,
        prerequisites: ["Todos los modulos y dependencias de binding deben existir."],
        notes: [
          ...baseNotes,
          "EXPORT(*ALL) es una propuesta inicial; para una interfaz estable prefiera binder language y firma."
        ]
      };
    }

    case "CLLE":
      return {
        language: input.language,
        command:
          `CRTBNDCL PGM(${library}/${object}) ${source()} DBGVIEW(${debugView}) ` +
          `TGTRLS(${targetRelease}) ACTGRP(${activationGroup(input.activationGroup, "*NEW")})`,
        executed: false,
        prerequisites: [],
        notes: [...baseNotes, "Verifique autoridad adoptada, lista de bibliotecas y comandos usados por el CLLE."]
      };

    case "CMD": {
      const program = input.program ? qualifiedName(input.program, library, "program") : `${library}/${object}`;
      return {
        language: input.language,
        command: `CRTCMD CMD(${library}/${object}) PGM(${program}) ${source()}`,
        executed: false,
        prerequisites: [`El programa procesador ${program} debe existir o compilarse antes.`],
        notes: [...baseNotes, "Revise PMTFILE, VLDCKR y restricciones de parametros antes de publicar el comando."]
      };
    }

    case "DSPF":
      return {
        language: input.language,
        command: `CRTDSPF FILE(${library}/${object}) ${source()}`,
        executed: false,
        prerequisites: [],
        notes: [...baseNotes, "Revise indicadores, teclas de funcion, subfiles y archivos referenciados."]
      };

    case "PF":
      return {
        language: input.language,
        command: `CRTPF FILE(${library}/${object}) ${source()}`,
        executed: false,
        prerequisites: [],
        notes: [...baseNotes, "Revise claves, textos y compatibilidad de cambios fisicos antes de crear el archivo."]
      };

    case "LF":
      return {
        language: input.language,
        command: `CRTLF FILE(${library}/${object}) ${source()}`,
        executed: false,
        prerequisites: ["Los archivos fisicos base deben existir."],
        notes: [...baseNotes, "Confirme claves, archivos base y reglas select/omit."]
      };
  }
}
