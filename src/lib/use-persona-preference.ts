import { useEffect, useState } from "react";
import type { Persona } from "@/generated/prisma/enums";
import { PERSONA_OPTIONS } from "@/lib/persona";

const STORAGE_KEY = "asobi-lab:persona";
const DEFAULT_PERSONA: Persona = "GENKI";

export function usePersonaPreference(): [Persona, (value: Persona) => void] {
  const [persona, setPersonaState] = useState<Persona>(DEFAULT_PERSONA);

  // localStorageはSSR時点で読めないため、初回レンダーはデフォルト値で返しておき、
  // マウント後に一度だけ実際の保存値を読み込む（ハイドレーション不一致を避けるための
  // 意図的なuseEffect。低頻度なUI状態の同期であり、カスケード再レンダーの懸念はない）。
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && PERSONA_OPTIONS.includes(stored as Persona)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPersonaState(stored as Persona);
    }
  }, []);

  const setPersona = (value: Persona) => {
    setPersonaState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  };

  return [persona, setPersona];
}
