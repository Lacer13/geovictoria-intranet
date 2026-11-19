import { drawTecnoiaV2 } from "./tecnoiaV2.js";
import { sampleTecnoiaGameplay, TECNOIA_GAME_PIVOT, gameplayMuzzle as tecnoiaMuzzle, tecnoiaPresentation } from "./tecnoiaGameplay.js";
import { drawConectiaV2 } from "./conectiaV2.js";
import { sampleConectiaGameplay, CONECTIA_GAME_PIVOT, gameplayMuzzle as conectiaMuzzle, conectiaPresentation } from "./conectiaGameplay.js";

const animations = {
  tecnoia: { draw: drawTecnoiaV2, sample: sampleTecnoiaGameplay, pivot: TECNOIA_GAME_PIVOT, muzzle: tecnoiaMuzzle, present: tecnoiaPresentation },
  conectia: { draw: drawConectiaV2, sample: sampleConectiaGameplay, pivot: CONECTIA_GAME_PIVOT, muzzle: conectiaMuzzle, present: conectiaPresentation },
};
export const characterAnimation = character => animations[typeof character === "string" ? character : character.id];
