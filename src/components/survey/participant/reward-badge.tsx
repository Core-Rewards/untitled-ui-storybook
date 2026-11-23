import { cx } from "@/utils/cx";
import { useSurveyCopy } from "../survey-context";
import type { SurveyReward } from "../survey-types";
import { rewardIcons } from "./reward-icons";

/** "Earn 500 points" pill. High contrast so the reward reads first. Quizzes pass their own label, e.g. "Pass to earn 250 points". */
export const RewardBadge = ({ reward, label, className }: { reward: SurveyReward; label?: string; className?: string }) => {
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
            {label ?? copy.earn(reward)}
        </span>
    );
};
