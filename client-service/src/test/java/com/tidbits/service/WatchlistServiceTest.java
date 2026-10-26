package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.model.dto.WatchlistItemDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.entity.WatchlistItem;
import com.tidbits.model.enums.InstrumentType;
import com.tidbits.repository.InstrumentRepository;
import com.tidbits.repository.WatchlistItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WatchlistServiceTest {

    @Mock
    private WatchlistItemRepository watchlistItemRepository;

    @Mock
    private InstrumentRepository instrumentRepository;

    @InjectMocks
    private WatchlistService watchlistService;

    private static final LocalDateTime ADDED = LocalDateTime.of(2026, 10, 20, 9, 30);

    @Test
    void getWatchlist_returnsItemsWithInstrumentNamesWhereKnown() {
        when(watchlistItemRepository.findByUserIdOrderByCreatedAtAsc(7)).thenReturn(List.of(
                new WatchlistItem(7, "AAPL", ADDED),
                new WatchlistItem(7, "ZZZZ", ADDED)));
        when(instrumentRepository.findByTickerIn(List.of("AAPL", "ZZZZ"))).thenReturn(List.of(
                new Instrument(1, "AAPL", "Apple Inc.", InstrumentType.equity, "NASDAQ")));

        List<WatchlistItemDTO> result = watchlistService.getWatchlist(7);

        assertEquals(2, result.size());
        assertEquals(new WatchlistItemDTO("AAPL", "Apple Inc.", ADDED), result.get(0));
        assertEquals("ZZZZ", result.get(1).ticker());
        assertNull(result.get(1).name());
    }

    @Test
    void getWatchlist_emptyListSkipsInstrumentLookup() {
        when(watchlistItemRepository.findByUserIdOrderByCreatedAtAsc(7)).thenReturn(List.of());

        assertEquals(List.of(), watchlistService.getWatchlist(7));
        verify(instrumentRepository, never()).findByTickerIn(anyList());
    }

    @Test
    void addToWatchlist_normalisesTickerAndSaves() {
        when(watchlistItemRepository.findByUserIdAndTicker(7, "BRK.B")).thenReturn(Optional.empty());
        when(watchlistItemRepository.countByUserId(7)).thenReturn(3L);
        when(watchlistItemRepository.save(any(WatchlistItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(instrumentRepository.findByTickerIn(List.of("BRK.B"))).thenReturn(List.of());

        WatchlistItemDTO result = watchlistService.addToWatchlist(7, "  brk.b ");

        ArgumentCaptor<WatchlistItem> saved = ArgumentCaptor.forClass(WatchlistItem.class);
        verify(watchlistItemRepository).save(saved.capture());
        assertEquals(7, saved.getValue().getUserId());
        assertEquals("BRK.B", saved.getValue().getTicker());
        assertEquals("BRK.B", result.ticker());
    }

    @Test
    void addToWatchlist_existingTickerIsNotSavedAgain() {
        WatchlistItem existing = new WatchlistItem(7, "AAPL", ADDED);
        when(watchlistItemRepository.findByUserIdAndTicker(7, "AAPL")).thenReturn(Optional.of(existing));
        when(instrumentRepository.findByTickerIn(List.of("AAPL"))).thenReturn(List.of());

        WatchlistItemDTO result = watchlistService.addToWatchlist(7, "AAPL");

        assertEquals(ADDED, result.addedAt());
        verify(watchlistItemRepository, never()).save(any());
    }

    @Test
    void addToWatchlist_rejectsInvalidTickers() {
        assertThrows(BadRequestException.class, () -> watchlistService.addToWatchlist(7, ""));
        assertThrows(BadRequestException.class, () -> watchlistService.addToWatchlist(7, null));
        assertThrows(BadRequestException.class, () -> watchlistService.addToWatchlist(7, "TOOLONGTICKER"));
        assertThrows(BadRequestException.class, () -> watchlistService.addToWatchlist(7, "AA PL"));
        verify(watchlistItemRepository, never()).save(any());
    }

    @Test
    void addToWatchlist_rejectsWhenFull() {
        when(watchlistItemRepository.findByUserIdAndTicker(7, "AAPL")).thenReturn(Optional.empty());
        when(watchlistItemRepository.countByUserId(7)).thenReturn((long) WatchlistService.MAX_ITEMS);

        assertThrows(BadRequestException.class, () -> watchlistService.addToWatchlist(7, "AAPL"));
        verify(watchlistItemRepository, never()).save(any());
    }

    @Test
    void removeFromWatchlist_deletesWhenPresentAndIgnoresWhenMissing() {
        WatchlistItem existing = new WatchlistItem(7, "AAPL", ADDED);
        when(watchlistItemRepository.findByUserIdAndTicker(7, "AAPL")).thenReturn(Optional.of(existing));
        when(watchlistItemRepository.findByUserIdAndTicker(7, "MSFT")).thenReturn(Optional.empty());

        watchlistService.removeFromWatchlist(7, "aapl");
        watchlistService.removeFromWatchlist(7, "MSFT");

        verify(watchlistItemRepository).delete(existing);
        verify(watchlistItemRepository, never()).delete(new WatchlistItem(7, "MSFT", ADDED));
    }
}
