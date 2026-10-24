package com.tidbits.service;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.dto.LotteryDrawDTO;
import com.tidbits.model.entity.LotteryDraw;
import com.tidbits.model.entity.LotteryTicket;
import com.tidbits.model.entity.PointsTransaction;
import com.tidbits.model.enums.LotteryDrawStatus;
import com.tidbits.model.enums.LotteryPrize;
import com.tidbits.model.enums.PointsEventType;
import com.tidbits.repository.LotteryDrawRepository;
import com.tidbits.repository.LotteryTicketRepository;
import com.tidbits.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Weekly prize drawings, one per {@link LotteryPrize}, all closing Friday evening.
 * Legacy draws without a prize retain their original points payouts.
 */
@Service
public class LotteryService {

    public static final int MAX_TICKETS_PER_PURCHASE = 50;
    /** Share of each ticket's price that goes into a legacy points pot (the rest is the house edge). */
    public static final int POT_SHARE_PERCENT = 90;

    private static final Logger log = LoggerFactory.getLogger(LotteryService.class);
    private static final LocalTime DRAW_TIME = LocalTime.of(20, 0);
    // Catalog order first; legacy points draws last.
    private static final Comparator<LotteryDraw> DISPLAY_ORDER = Comparator.comparing(
            LotteryDraw::getPrize, Comparator.nullsLast(Comparator.naturalOrder()));

    private final SecureRandom random = new SecureRandom();

    @Autowired
    private LotteryDrawRepository lotteryDrawRepository;

    @Autowired
    private LotteryTicketRepository lotteryTicketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointsLedgerService pointsLedgerService;

    @Transactional
    public PointsTransaction buyTickets(Integer userId, Integer drawId, Integer quantity) {
        if (drawId == null) {
            throw new BadRequestException("Choose a draw to enter.");
        }
        if (quantity == null || quantity < 1 || quantity > MAX_TICKETS_PER_PURCHASE) {
            throw new BadRequestException("Ticket quantity must be between 1 and " + MAX_TICKETS_PER_PURCHASE + ".");
        }

        LotteryDraw draw = lotteryDrawRepository.findLockedByDrawId(drawId)
                .orElseThrow(() -> new ResourceNotFoundException("Draw #" + drawId + " not found."));
        if (draw.getStatus() != LotteryDrawStatus.OPEN || !draw.getClosesAt().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Draw #" + draw.getDrawId() + " is closed. Try again after the results are in.");
        }

        int cost = Math.multiplyExact(quantity, draw.getTicketPrice());
        PointsTransaction debit = pointsLedgerService.record(userId, PointsEventType.LOTTERY_TICKET, -cost,
                new PointsLedgerService.Details(null, null, null, null, draw.getDrawId(),
                        quantity + (quantity == 1 ? " ticket" : " tickets") + " for draw #" + draw.getDrawId()
                            + (draw.getPrizeName() == null ? "" : ": " + draw.getPrizeName())));

        LocalDateTime now = LocalDateTime.now();
        List<LotteryTicket> tickets = new ArrayList<>(quantity);
        for (int i = 0; i < quantity; i++) {
            tickets.add(new LotteryTicket(draw.getDrawId(), userId, now));
        }
        lotteryTicketRepository.saveAll(tickets);

        draw.setTicketsSold(draw.getTicketsSold() + quantity);
        lotteryDrawRepository.save(draw);
        return debit;
    }

    /** Open draws in catalog order, opening one for any prize that lacks it. */
    @Transactional
    public List<LotteryDraw> getOrOpenCurrentDraws() {
        List<LotteryDraw> draws = new ArrayList<>(lotteryDrawRepository.findByStatusOrderByClosesAtAsc(LotteryDrawStatus.OPEN));
        Set<LotteryPrize> missing = EnumSet.allOf(LotteryPrize.class);
        draws.forEach(draw -> missing.remove(draw.getPrize()));
        missing.forEach(prize -> draws.add(openDraw(prize)));
        draws.sort(DISPLAY_ORDER);
        return draws;
    }

    /** The most recent result for each prize that has been drawn at least once. */
    public List<LotteryDraw> getLastDraws() {
        List<LotteryDraw> draws = new ArrayList<>();
        for (LotteryPrize prize : LotteryPrize.values()) {
            lotteryDrawRepository.findFirstByPrizeAndStatusOrderByDrawnAtDesc(prize, LotteryDrawStatus.DRAWN).ifPresent(draws::add);
        }
        return draws;
    }

    @Scheduled(fixedDelayString = "${rewards.lottery.check-interval-ms:60000}")
    @Transactional
    public void runDueDraws() {
        for (LotteryDraw draw : lotteryDrawRepository.findByStatusAndClosesAtLessThanEqual(LotteryDrawStatus.OPEN, LocalDateTime.now())) {
            runDraw(draw);
        }
    }

    void runDraw(LotteryDraw draw) {
        boolean prizeDraw = draw.getPrizeName() != null;
        int pot = prizeDraw ? 0 : potFor(draw);
        List<Integer> ticketIds = lotteryTicketRepository.findTicketIdsByDrawId(draw.getDrawId());

        draw.setStatus(LotteryDrawStatus.DRAWN);
        draw.setDrawnAt(LocalDateTime.now());

        if (ticketIds.isEmpty()) {
            draw.setPrizePoints(0);
            if (prizeDraw) {
                draw.setFulfillmentStatus("NO_WINNER");
            }
            closeAndReopen(draw);
            log.info("Lottery draw {} had no tickets; no prize awarded", draw.getDrawId());
            return;
        }

        Integer winningTicketId = ticketIds.get(random.nextInt(ticketIds.size()));
        LotteryTicket winningTicket = lotteryTicketRepository.findById(winningTicketId).orElseThrow();

        draw.setWinningTicketId(winningTicketId);
        draw.setWinnerUserId(winningTicket.getUserId());
        draw.setPrizePoints(pot);
        if (prizeDraw) {
            draw.setFulfillmentStatus("PENDING");
        }
        closeAndReopen(draw);

        pointsLedgerService.record(winningTicket.getUserId(), PointsEventType.LOTTERY_WIN, pot,
                new PointsLedgerService.Details(null, null, null, null, draw.getDrawId(),
                        "Won draw #" + draw.getDrawId() + " with ticket #" + winningTicketId
                                + (prizeDraw ? ": " + draw.getPrizeName() + ". " + draw.getPrizeDescription()
                                    + " Fulfillment pending; no cash or points payout." : "")));
        log.info("Lottery draw {} won by user {}", draw.getDrawId(), winningTicket.getUserId());
    }

    public LotteryDrawDTO toDto(LotteryDraw draw, Integer viewerUserId) {
        if (draw == null) {
            return null;
        }

        int pot = draw.getPrizeName() != null ? 0 : draw.getStatus() == LotteryDrawStatus.DRAWN && draw.getPrizePoints() != null && draw.getPrizePoints() > 0
                ? draw.getPrizePoints()
                : potFor(draw);
        String winnerLabel = draw.getWinnerUserId() == null ? null : userRepository.findById(draw.getWinnerUserId())
                .map(user -> maskUsername(user.getUsername()))
                .orElse("Client #" + draw.getWinnerUserId());

        return new LotteryDrawDTO(
                draw.getDrawId(),
                draw.getStatus().name(),
                draw.getTicketPrice(),
                pot,
                RewardsService.pointsToCash(pot),
                draw.getTicketsSold(),
                lotteryTicketRepository.countByDrawIdAndUserId(draw.getDrawId(), viewerUserId),
                draw.getClosesAt(),
                draw.getDrawnAt(),
                winnerLabel,
                draw.getWinnerUserId() != null && draw.getWinnerUserId().equals(viewerUserId),
                draw.getPrize() == null ? null : draw.getPrize().name(),
                draw.getPrizeName(),
                draw.getPrizeDescription(),
                draw.getFulfillmentStatus()
        );
    }

    static int potFor(LotteryDraw draw) {
        long ticketContribution = (long) draw.getTicketsSold() * draw.getTicketPrice() * POT_SHARE_PERCENT / 100;
        return Math.toIntExact(draw.getSeedPot() + ticketContribution);
    }

    static LocalDateTime nextDrawTime(LocalDateTime from) {
        LocalDateTime candidate = from.toLocalDate().with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY)).atTime(DRAW_TIME);
        return candidate.isAfter(from) ? candidate : candidate.plusWeeks(1);
    }

    /** Flushes the closed draw before opening the next one so the one-open-draw-per-prize index is never violated. */
    private void closeAndReopen(LotteryDraw draw) {
        lotteryDrawRepository.saveAndFlush(draw);
        if (draw.getPrize() != null) {
            openDraw(draw.getPrize());
        }
    }

    private LotteryDraw openDraw(LotteryPrize prize) {
        LocalDateTime now = LocalDateTime.now();
        LotteryDraw draw = new LotteryDraw();
        draw.setPrize(prize);
        draw.setPrizeName(prize.getDisplayName());
        draw.setPrizeDescription(prize.getDescription());
        draw.setFulfillmentStatus("NOT_DRAWN");
        draw.setTicketPrice(prize.getTicketPrice());
        draw.setSeedPot(0);
        draw.setTicketsSold(0);
        draw.setStatus(LotteryDrawStatus.OPEN);
        draw.setOpensAt(now);
        draw.setClosesAt(nextDrawTime(now));
        return lotteryDrawRepository.save(draw);
    }

    private String maskUsername(String username) {
        if (username == null || username.isBlank()) {
            return "Anonymous";
        }
        return username.charAt(0) + "***" + (username.length() > 1 ? username.charAt(username.length() - 1) : "");
    }
}
