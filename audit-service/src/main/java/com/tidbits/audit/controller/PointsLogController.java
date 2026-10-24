package com.tidbits.audit.controller;

import com.tidbits.audit.model.dto.PointsLogDTO;
import com.tidbits.audit.model.entity.InstrumentRef;
import com.tidbits.audit.model.entity.PointsLog;
import com.tidbits.audit.model.entity.UserFullRef;
import com.tidbits.audit.repository.InstrumentRefRepository;
import com.tidbits.audit.repository.UserFullRefRepository;
import com.tidbits.audit.service.PointsLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logs/points")
public class PointsLogController {

    @Autowired
    private PointsLogService pointsLogService;

    @Autowired
    private UserFullRefRepository userFullRefRepository;

    @Autowired
    private InstrumentRefRepository instrumentRefRepository;

    @GetMapping
    public ResponseEntity<List<PointsLogDTO>> getAllPointsLogs() {
        return ResponseEntity.ok(toDtos(pointsLogService.getAllPointsLogs()));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<PointsLogDTO>> getPointsLogsByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(toDtos(pointsLogService.getLogsByUserId(userId)));
    }

    private List<PointsLogDTO> toDtos(List<PointsLog> logs) {
        Map<Integer, String> usernames = userFullRefRepository.findAllById(distinct(logs, PointsLog::getUserId)).stream()
                .collect(Collectors.toMap(UserFullRef::getUserId, user -> Objects.toString(user.getUsername(), "")));
        Map<Integer, String> tickers = instrumentRefRepository.findAllById(distinct(logs, PointsLog::getInstrumentId)).stream()
                .collect(Collectors.toMap(InstrumentRef::getInstrumentId, instrument -> Objects.toString(instrument.getTicker(), "")));

        return logs.stream().map(log -> new PointsLogDTO(
                log.getLogId(),
                log.getUserId(),
                usernames.get(log.getUserId()),
                log.getAccountId(),
                log.getPointsTransactionId(),
                log.getEvent(),
                log.getPointsDelta(),
                log.getBalanceAfter(),
                log.getCashValue(),
                log.getInstrumentId(),
                tickers.get(log.getInstrumentId()),
                log.getQuantity(),
                log.getReferenceId(),
                log.getDetails(),
                log.getStatus(),
                log.getHappenedAt()
        )).collect(Collectors.toList());
    }

    private List<Integer> distinct(List<PointsLog> logs, Function<PointsLog, Integer> field) {
        return logs.stream().map(field).filter(Objects::nonNull).distinct().toList();
    }
}
