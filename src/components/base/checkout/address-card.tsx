import type { FC } from "react";
import { Radio } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { CheckoutAddress } from "./checkout-types";

interface AddressCardProps {
    /** The address to display. */
    address: CheckoutAddress;
    /** Called when the user clicks Edit. */
    onEdit: () => void;
    /** Called when the user clicks Delete. */
    onDelete: () => void;
}

/**
 * A selectable address card rendered inside a React Aria `RadioGroup`.
 * The `value` is set to `address.id` so the parent RadioGroup can track selection.
 */
export const AddressCard: FC<AddressCardProps> = ({ address, onEdit, onDelete }) => (
    <Radio
        value={address.id}
        className={({ isSelected, isFocusVisible }) =>
            cx(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 outline-none transition-colors duration-100",
                isFocusVisible && "ring-2 ring-brand-solid ring-offset-2",
                isSelected
                    ? "border-brand-solid bg-brand-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            )
        }
    >
        {({ isSelected }) => (
            <>
                {/* Custom radio dot */}
                <div
                    aria-hidden="true"
                    className={cx(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-100",
                        isSelected ? "border-brand-solid bg-brand-solid" : "border-gray-300 bg-white",
                    )}
                >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>

                {/* Address details */}
                <div className="flex-1 text-sm leading-relaxed">
                    <p className="font-semibold text-primary">{address.name}</p>
                    <p className="text-tertiary">{address.street}</p>
                    <p className="text-tertiary">
                        {address.city}, {address.state} {address.zip}
                    </p>
                    <p className="text-tertiary">{address.country}</p>
                </div>

                {/*
                 * Edit / Delete actions.
                 * `onPointerDown` propagation is stopped so clicking these
                 * buttons does not also trigger Radio selection via RAC's
                 * pointer-based press detection.
                 */}
                <div
                    className="flex shrink-0 items-center gap-1 self-start"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Button color="link-color" size="sm" onClick={onEdit}>
                        Edit
                    </Button>
                    <span aria-hidden="true" className="text-sm text-gray-300">
                        ·
                    </span>
                    <Button color="link-gray" size="sm" onClick={onDelete}>
                        Delete
                    </Button>
                </div>
            </>
        )}
    </Radio>
);
