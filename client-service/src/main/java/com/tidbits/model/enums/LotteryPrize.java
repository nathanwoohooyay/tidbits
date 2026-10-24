package com.tidbits.model.enums;

/**
 * Prize catalog for the weekly draws. Each prize always has its own open draw;
 * ticket price scales with the prize's value.
 */
public enum LotteryPrize {
    SPORTS_TICKETS("VIP sports tickets",
            "Two premium match-day tickets with hospitality. Event and dates arranged during fulfillment.", 250),
    WINE_COLLECTION("Rare wine collection",
            "A curated collection of premium fine wines. Legal drinking age and delivery eligibility must be verified before fulfillment.", 500),
    CHEFS_TABLE("Chef's table dinner",
            "A private tasting-menu dinner for two at a Michelin-starred restaurant. Restaurant and date arranged during fulfillment.", 500),
    YACHT_CHARTER("Private yacht escape",
            "A private day-charter yacht experience for two, with a skipper. Destination and dates arranged during fulfillment; not yacht ownership.", 1000),
    LUXURY_WATCH("Swiss luxury watch",
            "A Swiss-made luxury timepiece from a curated selection. Model subject to availability; delivery eligibility verified before fulfillment.", 1000),
    SUPERCAR_WEEKEND("Supercar weekend",
            "A weekend with an insured supercar from a curated garage. Valid driving licence and minimum age apply; not vehicle ownership.", 1500),
    PRIVATE_JET("Private jet experience",
            "A private-jet flight experience for two. Route and dates arranged during fulfillment; not aircraft ownership.", 2000);

    private final String displayName;
    private final String description;
    private final int ticketPrice;

    LotteryPrize(String displayName, String description, int ticketPrice) {
        this.displayName = displayName;
        this.description = description;
        this.ticketPrice = ticketPrice;
    }

    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }
    public int getTicketPrice() { return ticketPrice; }
}
