export type CheckoutAddress = {
    /** Unique identifier for the address. */
    id: string;
    /** Full name of the recipient. */
    name: string;
    /** Street address (line 1). */
    street: string;
    /** City. */
    city: string;
    /** State or province abbreviation. */
    state: string;
    /** ZIP or postal code. */
    zip: string;
    /** Country name. */
    country: string;
};
