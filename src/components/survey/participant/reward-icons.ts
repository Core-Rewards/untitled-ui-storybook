import { CoinsStacked01, Dice5, Ticket01 } from "@untitledui/icons";
import type { SurveyRewardType } from "../survey-types";

/** Icon for each reward type. */
export const rewardIcons: Record<SurveyRewardType, typeof CoinsStacked01> = {
    points: CoinsStacked01,
    sweepstakes: Ticket01,
    arcade_spins: Dice5,
};
