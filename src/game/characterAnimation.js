import { drawTecnoiaV2 } from "./tecnoiaV2.js";
import { sampleTecnoiaGameplay, TECNOIA_GAME_PIVOT, gameplayMuzzle as tecnoiaMuzzle, tecnoiaPresentation } from "./tecnoiaGameplay.js";
import { drawConectiaV2 } from "./conectiaV2.js";
import { sampleConectiaGameplay, CONECTIA_GAME_PIVOT, gameplayMuzzle as conectiaMuzzle, conectiaPresentation } from "./conectiaGameplay.js";

import { drawCierreiaV2 } from "./cierreiaV2.js";
import { sampleCierreiaGameplay, CIERREIA_GAME_PIVOT, gameplayMuzzle as cierreiaMuzzle, cierreiaPresentation } from "./cierreiaGameplay.js";
const animations = {
  cierreia: { draw: drawCierreiaV2, sample: sampleCierreiaGameplay, pivot: CIERREIA_GAME_PIVOT, muzzle: cierreiaMuzzle, present: cierreiaPresentation },
  tecnoia: { draw: drawTecnoiaV2, sample: sampleTecnoiaGameplay, pivot: TECNOIA_GAME_PIVOT, muzzle: tecnoiaMuzzle, present: tecnoiaPresentation },
  conectia: { draw: drawConectiaV2, sample: sampleConectiaGameplay, pivot: CONECTIA_GAME_PIVOT, muzzle: conectiaMuzzle, present: conectiaPresentation },
};
export const characterAnimation = character => animations[typeof character === "string" ? character : character.id];
