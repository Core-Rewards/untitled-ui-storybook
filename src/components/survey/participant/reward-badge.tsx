import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import type { SurveyReward } from "../survey-types";
import { rewardIcons } from "./reward-icons";

/** "Earn 500 points" pill. High contrast so the reward reads first. */
export const RewardBadge = ({ reward, className }: { reward: SurveyReward; className?: string }) => {
    const { copy } = useSurveyCopy();
    const Icon = rewardIcons[reward.type];
    return (
        <span
            className={cx(
                "inline-flex items-center gap-1.5 rounded-full bg-primary-solid px-3 py-1 text-sm font-semibold whitespace-nowrap text-white",
                className,
            )}
        >
            <Icon className="size-4" aria-hidden="true" />
            {copy.earn(reward)}
        </span>
    );
};
