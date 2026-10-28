# Prize thumbnails

The seven catalog prizes use illustrative photos hosted at `images.unsplash.com`,
configured by `PRIZE_PHOTOS` in the rewards page component. These require network
access; failed images fall back to the prize's emoji. Photos illustrate prize
categories and do not represent guaranteed models, venues, or providers.

For self-hosted imagery, remove a prize's entry from `PRIZE_PHOTOS` and add its
image to this folder using the names below.

| Prize | File |
| --- | --- |
| VIP sports tickets | `sports-tickets.jpg` |
| Rare wine collection | `wine-collection.jpg` |
| Chef's table dinner | `chefs-table.jpg` |
| Private yacht escape | `yacht-charter.jpg` |
| Swiss luxury watch | `luxury-watch.jpg` |
| Supercar weekend | `supercar-weekend.jpg` |
| Private jet experience | `private-jet.jpg` |

Images use `object-fit: cover` in a wide featured banner or a 2:1 thumbnail
(2.6:1 on wide desktops). Use landscape photos with centrally placed subjects.
A new prize added to the backend's `LotteryPrize` enum uses its code in kebab case
(e.g. `NEW_PRIZE` -> `new-prize.jpg`).

The highest-ticket-price open draw is featured as the grand prize. Ties use the
API's original order. This changes presentation only, not prize values or odds.
