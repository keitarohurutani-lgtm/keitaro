import type { Persona } from "@/generated/prisma/enums";

export const PERSONA_LABEL: Record<Persona, string> = {
  GENKI: "元気印・とにかく明るいキャラクター",
  COOL: "クール・落ち着いたキャラクター",
  HONWAKA: "ほんわか・癒し系キャラクター",
  DOKUZETSU: "毒舌気味・ツッコミが得意なキャラクター",
  SEITOHA: "正統派・王道アイドルらしいキャラクター",
};

export const PERSONA_OPTIONS: Persona[] = [
  "GENKI",
  "COOL",
  "HONWAKA",
  "DOKUZETSU",
  "SEITOHA",
];
