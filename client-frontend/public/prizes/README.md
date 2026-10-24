# Prize thumbnails

The rewards page shows one image per prize from this folder. Until a file exists,
the card shows a tinted tile with the prize's emoji.

| Prize | File |
| --- | --- |
| VIP sports tickets | `sports-tickets.jpg` |
| Rare wine collection | `wine-collection.jpg` |
| Chef's table dinner | `chefs-table.jpg` |
| Private yacht escape | `yacht-charter.jpg` |
| Swiss luxury watch | `luxury-watch.jpg` |
| Supercar weekend | `supercar-weekend.jpg` |
| Private jet experience | `private-jet.jpg` |

Images are cropped to 4:3 with `object-fit: cover`; around 800×600 works well.
A new prize added to the backend's `LotteryPrize` enum uses its code in kebab case
(e.g. `NEW_PRIZE` -> `new-prize.jpg`).
