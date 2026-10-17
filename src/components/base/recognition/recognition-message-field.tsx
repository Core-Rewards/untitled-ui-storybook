import type { FC } from "react";
import { TextArea } from "@/components/base/textarea/textarea";
import { formatPoints } from "./recognition-utils";

interface RecognitionMessageFieldProps {
    value: string;
    onChange: (value: string) => void;
    /** Defaults to 500. */
    maxLength?: number;
    /** Personalizes the placeholder. */
    recipientFirstName?: string;
    label?: string;
}

export const RecognitionMessageField: FC<RecognitionMessageFieldProps> = ({ value, onChange, maxLength = 500, recipientFirstName, label = "Message" }) => (
    <TextArea
        label={label}
        placeholder={`Tell ${recipientFirstName ?? "them"} what they did and why it mattered.`}
        rows={5}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        isRequired
        validationBehavior="aria"
        hint={`${formatPoints(value.length)}/${formatPoints(maxLength)} characters`}
    />
);
