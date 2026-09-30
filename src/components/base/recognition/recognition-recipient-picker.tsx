import { type FC, useRef, useState } from "react";
import type { Key } from "react-aria-components";
import { useAsyncList, useFilter } from "react-aria-components";
import { ComboBox } from "@/components/base/select/combobox";
import { SelectItem } from "@/components/base/select/select-item";
import type { RecognitionParticipant } from "./recognition-types";
import { participantSupportingText, participantTextValue } from "./recognition-utils";

/** Id of the disabled row that reports "Searching…" or "No one matches". */
const STATUS_ID = "__status";

interface RecognitionRecipientPickerProps {
    /** People to choose from, filtered as the user types. */
    participants?: RecognitionParticipant[];
    /** Searches on the server as the user types. Takes precedence over `participants`. */
    onSearch?: (query: string, signal: AbortSignal) => Promise<RecognitionParticipant[]>;
    selected: RecognitionParticipant | null;
    onChange: (participant: RecognitionParticipant | null) => void;
    label?: string;
    placeholder?: string;
}

export const RecognitionRecipientPicker: FC<RecognitionRecipientPickerProps> = ({
    participants = [],
    onSearch,
    selected,
    onChange,
    label = "Recipient",
    placeholder = "Search by name",
}) => {
    const { contains } = useFilter({ sensitivity: "base" });
    const [inputValue, setInputValue] = useState(selected ? participantTextValue(selected) : "");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const list = useAsyncList<RecognitionParticipant>({
        async load({ signal, filterText }) {
            return { items: onSearch ? await onSearch(filterText ?? "", signal) : [] };
        },
    });

    // Once someone is selected the input holds their name and title. That is not a search, so
    // reopening the list shows everyone rather than only the selected person.
    const isShowingSelection = selected !== null && inputValue === participantTextValue(selected);
    const query = isShowingSelection ? "" : inputValue;

    const results = onSearch ? list.items : participants.filter((participant) => contains(participantTextValue(participant), query));
    // Server results may not include the selected person, but the combobox needs them to display
    // the selection. Only add them back while the input shows them, not during a new search.
    const items = selected && isShowingSelection && !results.some((participant) => participant.id === selected.id) ? [selected, ...results] : results;

    const handleInputChange = (value: string) => {
        setInputValue(value);
        if (onSearch && !(selected && value === participantTextValue(selected))) list.setFilterText(value);
    };

    const handleSelectionChange = (key: Key | null) => {
        if (key === STATUS_ID) return;

        // When focus leaves mid-search without a new pick, the combobox deselects the current
        // recipient. Keep them and restore their name, so an abandoned search changes nothing.
        const isFocused = wrapperRef.current?.contains(document.activeElement) ?? false;
        if (key === null && selected && !isFocused) {
            setInputValue(participantTextValue(selected));
            return;
        }

        // Look up the current recipient too: the combobox reconfirms them on blur, and a new
        // search may have left them out of the results.
        const participant = key === null ? null : (items.find((item) => item.id === key) ?? (selected?.id === key ? selected : null));

        onChange(participant);
        if (participant) {
            setInputValue(participantTextValue(participant));
            // Reset the server search, so reopening the list shows everyone again.
            if (onSearch && list.filterText !== "") list.setFilterText("");
        }
    };

    const isSearching = onSearch !== undefined && (list.loadingState === "loading" || list.loadingState === "filtering");
    const hasNoMatches = query.trim() !== "" && !isSearching && results.length === 0;
    // Shown as a disabled row, which also keeps the list open while server results load.
    const status = isSearching && results.length === 0 ? "Searching…" : hasNoMatches ? `No one matches “${query.trim()}”` : null;

    return (
        <div ref={wrapperRef}>
            <ComboBox
                label={label}
                placeholder={placeholder}
                shortcut={false}
                isRequired
                validationBehavior="aria"
                items={[
                    ...items.map((participant) => ({ id: participant.id, label: participant.name, supportingText: participantSupportingText(participant) })),
                    ...(status ? [{ id: STATUS_ID, label: status, isDisabled: true }] : []),
                ]}
                // Filtering happens above, so the combobox shows the items as given.
                defaultFilter={() => true}
                inputValue={inputValue}
                onInputChange={handleInputChange}
                selectedKey={selected?.id ?? null}
                onSelectionChange={handleSelectionChange}
            >
                {(item) => <SelectItem id={item.id} label={item.label} supportingText={item.supportingText} isDisabled={item.isDisabled} />}
            </ComboBox>
        </div>
    );
};
