package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.LotteryDraw;
import com.tidbits.model.entity.LotteryTicket;
import com.tidbits.model.entity.PointsTransaction;
import com.tidbits.model.enums.LotteryDrawStatus;
import com.tidbits.model.enums.LotteryPrize;
import com.tidbits.model.enums.PointsEventType;
import com.tidbits.repository.LotteryDrawRepository;
import com.tidbits.repository.LotteryTicketRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LotteryServiceTest {

    @Mock
    private LotteryDrawRepository lotteryDrawRepository;

    @Mock
    private LotteryTicketRepository lotteryTicketRepository;

    @Mock
    private PointsLedgerService pointsLedgerService;

    @InjectMocks
    private LotteryService lotteryService;

    @Test
    void buyTickets_debitsTheChosenDrawsTicketPrice() {
        LotteryDraw draw = prizeDraw(5, LotteryPrize.YACHT_CHARTER, 10, LocalDateTime.now().plusDays(2));
        when(lotteryDrawRepository.findLockedByDrawId(5)).thenReturn(Optional.of(draw));
        when(pointsLedgerService.record(eq(1), eq(PointsEventType.LOTTERY_TICKET), eq(-3_000), any())).thenReturn(new PointsTransaction());

        lotteryService.buyTickets(1, 5, 3);

        assertEquals(13, draw.getTicketsSold());
        ArgumentCaptor<List<LotteryTicket>> tickets = ArgumentCaptor.forClass(List.class);
        verify(lotteryTicketRepository).saveAll(tickets.capture());
        assertEquals(3, tickets.getValue().size());
        assertTrue(tickets.getValue().stream().allMatch(ticket -> ticket.getDrawId() == 5));
        verify(lotteryDrawRepository).save(draw);
    }

    @Test
    void buyTickets_rejectsMissingDrawAndQuantityOutsideLimits() {
        assertThrows(BadRequestException.class, () -> lotteryService.buyTickets(1, null, 1));
        assertThrows(BadRequestException.class, () -> lotteryService.buyTickets(1, 5, 0));
        assertThrows(BadRequestException.class, () -> lotteryService.buyTickets(1, 5, LotteryService.MAX_TICKETS_PER_PURCHASE + 1));
        verify(pointsLedgerService, never()).record(anyInt(), any(), anyInt(), any());
    }

    @Test
    void buyTickets_rejectsUnknownDraw() {
        when(lotteryDrawRepository.findLockedByDrawId(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> lotteryService.buyTickets(1, 99, 1));
        verify(pointsLedgerService, never()).record(anyInt(), any(), anyInt(), any());
    }

    @Test
    void buyTickets_rejectsClosedOrDrawnDraw() {
        LotteryDraw pastClose = prizeDraw(5, LotteryPrize.WINE_COLLECTION, 10, LocalDateTime.now().minusMinutes(1));
        LotteryDraw drawn = prizeDraw(6, LotteryPrize.WINE_COLLECTION, 10, LocalDateTime.now().plusDays(1));
        drawn.setStatus(LotteryDrawStatus.DRAWN);
        when(lotteryDrawRepository.findLockedByDrawId(5)).thenReturn(Optional.of(pastClose));
        when(lotteryDrawRepository.findLockedByDrawId(6)).thenReturn(Optional.of(drawn));

        assertThrows(BadRequestException.class, () -> lotteryService.buyTickets(1, 5, 1));
        assertThrows(BadRequestException.class, () -> lotteryService.buyTickets(1, 6, 1));
        verify(pointsLedgerService, never()).record(anyInt(), any(), anyInt(), any());
    }

    @Test
    void getOrOpenCurrentDraws_opensADrawForEachPrizeWithoutOne() {
        LotteryDraw yacht = prizeDraw(5, LotteryPrize.YACHT_CHARTER, 3, LocalDateTime.now().plusDays(2));
        when(lotteryDrawRepository.findByStatusOrderByClosesAtAsc(LotteryDrawStatus.OPEN)).thenReturn(List.of(yacht));
        when(lotteryDrawRepository.save(any(LotteryDraw.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<LotteryDraw> draws = lotteryService.getOrOpenCurrentDraws();

        assertEquals(Arrays.asList(LotteryPrize.values()), draws.stream().map(LotteryDraw::getPrize).toList());
        assertSame(yacht, draws.get(LotteryPrize.YACHT_CHARTER.ordinal()));
        verify(lotteryDrawRepository, times(LotteryPrize.values().length - 1)).save(any(LotteryDraw.class));
        LotteryDraw jet = draws.get(LotteryPrize.PRIVATE_JET.ordinal());
        assertEquals(LotteryPrize.PRIVATE_JET.getTicketPrice(), jet.getTicketPrice());
        assertEquals(LotteryPrize.PRIVATE_JET.getDisplayName(), jet.getPrizeName());
        assertEquals(LotteryDrawStatus.OPEN, jet.getStatus());
        assertEquals(DayOfWeek.FRIDAY, jet.getClosesAt().getDayOfWeek());
    }

    @Test
    void getOrOpenCurrentDraws_keepsLegacyPointsDrawLast() {
        LotteryDraw legacy = legacyPointsDraw(4, 2, LocalDateTime.now().plusDays(2));
        when(lotteryDrawRepository.findByStatusOrderByClosesAtAsc(LotteryDrawStatus.OPEN)).thenReturn(List.of(legacy));
        when(lotteryDrawRepository.save(any(LotteryDraw.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<LotteryDraw> draws = lotteryService.getOrOpenCurrentDraws();

        assertEquals(LotteryPrize.values().length + 1, draws.size());
        assertSame(legacy, draws.get(draws.size() - 1));
    }

    @Test
    void runDraw_recordsPrizeWinnerAndReopensTheSamePrize() {
        LotteryDraw draw = prizeDraw(5, LotteryPrize.YACHT_CHARTER, 1, LocalDateTime.now().minusMinutes(1));
        LotteryTicket ticket = new LotteryTicket(5, 9, LocalDateTime.now());
        ticket.setTicketId(77);
        when(lotteryTicketRepository.findTicketIdsByDrawId(5)).thenReturn(List.of(77));
        when(lotteryTicketRepository.findById(77)).thenReturn(Optional.of(ticket));
        when(lotteryDrawRepository.save(any(LotteryDraw.class))).thenAnswer(invocation -> invocation.getArgument(0));

        lotteryService.runDraw(draw);

        assertEquals(LotteryDrawStatus.DRAWN, draw.getStatus());
        assertEquals(9, draw.getWinnerUserId());
        assertEquals(77, draw.getWinningTicketId());
        assertEquals(0, draw.getPrizePoints());
        assertEquals("PENDING", draw.getFulfillmentStatus());
        verify(lotteryDrawRepository).saveAndFlush(draw);

        ArgumentCaptor<PointsLedgerService.Details> details = ArgumentCaptor.forClass(PointsLedgerService.Details.class);
        verify(pointsLedgerService).record(eq(9), eq(PointsEventType.LOTTERY_WIN), eq(0), details.capture());
        assertEquals(5, details.getValue().referenceId());
        assertTrue(details.getValue().description().contains("Private yacht escape"));
        assertTrue(details.getValue().description().contains("Fulfillment pending"));

        ArgumentCaptor<LotteryDraw> next = ArgumentCaptor.forClass(LotteryDraw.class);
        verify(lotteryDrawRepository).save(next.capture());
        assertEquals(LotteryPrize.YACHT_CHARTER, next.getValue().getPrize());
        assertEquals(LotteryDrawStatus.OPEN, next.getValue().getStatus());
        assertEquals(0, next.getValue().getTicketsSold());
    }

    @Test
    void runDraw_prizeWithoutTicketsHasNoWinner() {
        LotteryDraw draw = prizeDraw(5, LotteryPrize.SPORTS_TICKETS, 0, LocalDateTime.now().minusMinutes(1));
        when(lotteryTicketRepository.findTicketIdsByDrawId(5)).thenReturn(List.of());
        when(lotteryDrawRepository.save(any(LotteryDraw.class))).thenAnswer(invocation -> invocation.getArgument(0));

        lotteryService.runDraw(draw);

        assertNull(draw.getWinnerUserId());
        assertEquals("NO_WINNER", draw.getFulfillmentStatus());
        verify(pointsLedgerService, never()).record(anyInt(), any(), anyInt(), any());
        ArgumentCaptor<LotteryDraw> next = ArgumentCaptor.forClass(LotteryDraw.class);
        verify(lotteryDrawRepository).save(next.capture());
        assertEquals(LotteryPrize.SPORTS_TICKETS, next.getValue().getPrize());
    }

    @Test
    void runDraw_legacyPointsDrawPaysPotWithoutReopening() {
        LotteryDraw draw = legacyPointsDraw(4, 2, LocalDateTime.now().minusMinutes(1));
        LotteryTicket ticket = new LotteryTicket(4, 9, LocalDateTime.now());
        ticket.setTicketId(77);
        when(lotteryTicketRepository.findTicketIdsByDrawId(4)).thenReturn(List.of(77));
        when(lotteryTicketRepository.findById(77)).thenReturn(Optional.of(ticket));

        lotteryService.runDraw(draw);

        int expectedPot = 100_000 + 2 * 500 * LotteryService.POT_SHARE_PERCENT / 100;
        assertEquals(expectedPot, draw.getPrizePoints());
        verify(pointsLedgerService).record(eq(9), eq(PointsEventType.LOTTERY_WIN), eq(expectedPot), any());
        verify(lotteryDrawRepository).saveAndFlush(draw);
        verify(lotteryDrawRepository, never()).save(any(LotteryDraw.class));
    }

    @Test
    void nextDrawTime_isTheComingFridayEvening() {
        LocalDateTime wednesday = LocalDateTime.of(2026, 10, 21, 9, 0);
        assertEquals(LocalDateTime.of(2026, 10, 23, 20, 0), LotteryService.nextDrawTime(wednesday));

        LocalDateTime fridayAfterDraw = LocalDateTime.of(2026, 10, 23, 20, 30);
        LocalDateTime next = LotteryService.nextDrawTime(fridayAfterDraw);
        assertEquals(DayOfWeek.FRIDAY, next.getDayOfWeek());
        assertEquals(LocalDateTime.of(2026, 10, 30, 20, 0), next);
    }

    private LotteryDraw prizeDraw(Integer drawId, LotteryPrize prize, int ticketsSold, LocalDateTime closesAt) {
        LotteryDraw draw = openDraw(drawId, prize.getTicketPrice(), ticketsSold, closesAt);
        draw.setPrize(prize);
        draw.setPrizeName(prize.getDisplayName());
        draw.setPrizeDescription(prize.getDescription());
        draw.setFulfillmentStatus("NOT_DRAWN");
        return draw;
    }

    private LotteryDraw legacyPointsDraw(Integer drawId, int ticketsSold, LocalDateTime closesAt) {
        LotteryDraw draw = openDraw(drawId, 500, ticketsSold, closesAt);
        draw.setSeedPot(100_000);
        return draw;
    }

    private LotteryDraw openDraw(Integer drawId, int ticketPrice, int ticketsSold, LocalDateTime closesAt) {
        LotteryDraw draw = new LotteryDraw();
        draw.setDrawId(drawId);
        draw.setTicketPrice(ticketPrice);
        draw.setSeedPot(0);
        draw.setTicketsSold(ticketsSold);
        draw.setStatus(LotteryDrawStatus.OPEN);
        draw.setOpensAt(closesAt.minusDays(7));
        draw.setClosesAt(closesAt);
        return draw;
    }
}
