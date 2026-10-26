package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.model.dto.WatchlistItemDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.WatchlistItem;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.WatchlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class WatchlistService {

    static final int MAX_ITEMS = 50;
    // Same shape as instrument tickers: 1-8 letters, digits, dots or dashes (e.g. AAPL, BRK.B).
    private static final Pattern TICKER = Pattern.compile("^[A-Z0-9.\\-]{1,8}$");

    @Autowired
    private WatchlistItemRepository watchlistItemRepository;

    @Autowired
    private InstrumentRepository instrumentRepository;

    public List<WatchlistItemDTO> getWatchlist(Integer userId) {
        return toDtos(watchlistItemRepository.findByUserIdOrderByCreatedAtAsc(userId));
    }

    // Adding a stock that's already on the list is a no-op that returns the existing entry.
    @Transactional
    public WatchlistItemDTO addToWatchlist(Integer userId, String rawTicker) {
        String ticker = normalise(rawTicker);
        WatchlistItem item = watchlistItemRepository.findByUserIdAndTicker(userId, ticker).orElseGet(() -> {
            if (watchlistItemRepository.countByUserId(userId) >= MAX_ITEMS) {
                throw new BadRequestException("Your watchlist is full (" + MAX_ITEMS + " stocks). Remove one to add another.");
            }
            return watchlistItemRepository.save(new WatchlistItem(userId, ticker, LocalDateTime.now()));
        });
        return toDtos(List.of(item)).get(0);
    }

    // Removing a stock that isn't on the list is a no-op.
    @Transactional
    public void removeFromWatchlist(Integer userId, String rawTicker) {
        watchlistItemRepository.findByUserIdAndTicker(userId, normalise(rawTicker))
                .ifPresent(watchlistItemRepository::delete);
    }

    private String normalise(String rawTicker) {
        String ticker = rawTicker == null ? "" : rawTicker.trim().toUpperCase(Locale.ROOT);
        if (!TICKER.matcher(ticker).matches()) {
            throw new BadRequestException("Enter a valid ticker symbol.");
        }
        return ticker;
    }

    private List<WatchlistItemDTO> toDtos(List<WatchlistItem> items) {
        List<String> tickers = items.stream().map(WatchlistItem::getTicker).toList();
        Map<String, String> names = tickers.isEmpty() ? Map.of() : instrumentRepository.findByTickerIn(tickers).stream()
                .collect(Collectors.toMap(Instrument::getTicker, Instrument::getName, (a, b) -> a));
        return items.stream()
                .map(item -> new WatchlistItemDTO(item.getTicker(), names.get(item.getTicker()), item.getCreatedAt()))
                .toList();
    }
}
