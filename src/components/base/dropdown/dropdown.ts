import { MenuTrigger as AriaMenuTrigger, MenuSection as AriaMenuSection, Header as AriaHeader } from "react-aria-components";
import { DropdownPopover, DropdownMenu, DropdownItem, DropdownSeparator, DropdownDotsButton } from "./dropdown-parts";

/** Untitled UI dropdown menu, ported from AdminUI. Use as `<Dropdown.Root>` with `Dropdown.Popover`, `Dropdown.Menu` and `Dropdown.Item`. */
export const Dropdown = {
    Root: AriaMenuTrigger,
    Popover: DropdownPopover,
    Menu: DropdownMenu,
    Section: AriaMenuSection,
    SectionHeader: AriaHeader,
    Item: DropdownItem,
    Separator: DropdownSeparator,
    DotsButton: DropdownDotsButton,
};
