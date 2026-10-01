package com.tidbits.repository;

import com.tidbits.model.entity.Instrument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface InstrumentRepository extends JpaRepository<Instrument, Integer> {
    Optional<Instrument> findByTicker(String ticker);
    Optional<Instrument> findByTickerIgnoreCase(String ticker);

    @Query("SELECT i FROM Instrument i WHERE LOWER(i.ticker) IN :tickers")
    List<Instrument> findByTickerInIgnoreCase(@Param("tickers") List<String> tickers);
}
