package com.tidbits.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.model.dto.PricingCandlesResponseDTO;
import com.tidbits.model.dto.PricingQuoteDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.enums.InstrumentType;
import com.tidbits.repository.InstrumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private InstrumentRepository instrumentRepository;

    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        when(restTemplateBuilder.rootUri(any(String.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.build()).thenReturn(restTemplate);

        pricingService = new PricingService(
                restTemplateBuilder,
                instrumentRepository,
                "http://fauxnance.example",
                "test-key",
                5,
                60
        );
    }

    @Test
    void getRequestedQuotes_reusesExistingInstrumentIdWhenInstrumentAlreadyInDatabase() throws Exception {
        Instrument existingInstrument = new Instrument();
        existingInstrument.setInstrumentId(42);
        existingInstrument.setTicker("AAPL");

        Map<String, Instrument> existingInstrumentsBySymbol = new HashMap<>();
        existingInstrumentsBySymbol.put("AAPL", existingInstrument);

        JsonNode quoteBody = OBJECT_MAPPER.readTree("""
                {
                  "data": {
                    "quotes": [
                      {
                        "symbol": "AAPL",
                        "quote": {
                          "symbol": "AAPL",
                          "price": 213.5,
                          "change": 1.2,
                          "bid": 213.4,
                          "ask": 213.6,
                          "changePercent": 0.56,
                          "previousClose": 212.3,
                          "currency": "USD",
                          "asOf": "2026-10-01T10:15:30"
                        },
                        "stale": false,
                        "source": "fauxnance"
                      }
                    ]
                  }
                }
                """);

        when(restTemplate.exchange(
                eq("/quotes?symbols={symbols}"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(JsonNode.class),
                eq("AAPL")
        )).thenReturn(ResponseEntity.ok(quoteBody));

        when(instrumentRepository.save(any(Instrument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<PricingQuoteDTO> result = pricingService.getRequestedQuotes(List.of("AAPL"), existingInstrumentsBySymbol);

        assertEquals(1, result.size());
        assertEquals(42, result.getFirst().instrumentId());
        assertEquals("AAPL", result.getFirst().symbol());
        verify(restTemplate, never()).exchange(
                eq("/symbols/{symbol}"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(JsonNode.class),
                any(String.class)
        );
    }

    @Test
    void getRequestedQuotes_returnsGeneratedInstrumentIdForNewInstrumentFromFauxnance() throws Exception {
        Map<String, Instrument> existingInstrumentsBySymbol = new HashMap<>();

        JsonNode quoteBody = OBJECT_MAPPER.readTree("""
                {
                  "data": {
                    "quotes": [
                      {
                        "symbol": "MSFT",
                        "quote": {
                          "symbol": "MSFT",
                          "price": 501.1,
                          "change": -0.8,
                          "bid": 501.0,
                          "ask": 501.2,
                          "changePercent": -0.16,
                          "previousClose": 501.9,
                          "currency": "USD",
                          "asOf": "2026-10-01T10:20:00"
                        },
                        "stale": false,
                        "source": "fauxnance"
                      }
                    ]
                  }
                }
                """);

        JsonNode symbolBody = OBJECT_MAPPER.readTree("""
                {
                  "data": {
                    "symbol": "MSFT",
                    "name": "Microsoft Corp",
                    "type": "equity",
                    "exchange": "NASDAQ",
                    "currency": "USD"
                  }
                }
                """);

        when(restTemplate.exchange(
                eq("/quotes?symbols={symbols}"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(JsonNode.class),
                eq("MSFT")
        )).thenReturn(ResponseEntity.ok(quoteBody));

        when(restTemplate.exchange(
                eq("/symbols/{symbol}"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(JsonNode.class),
                eq("MSFT")
        )).thenReturn(ResponseEntity.ok(symbolBody));

        when(instrumentRepository.save(any(Instrument.class))).thenAnswer(invocation -> {
            Instrument instrument = invocation.getArgument(0);
            instrument.setInstrumentId(777);
            return instrument;
        });

        List<PricingQuoteDTO> result = pricingService.getRequestedQuotes(List.of("MSFT"), existingInstrumentsBySymbol);

        assertEquals(1, result.size());
        PricingQuoteDTO quote = result.getFirst();
        assertEquals(777, quote.instrumentId());
        assertEquals("MSFT", quote.symbol());
    }

    private static final String CANDLES_URI = "/candles/AAPL?from=2026-09-26&interval=1d";

    private JsonNode candlesBody() throws Exception {
        return OBJECT_MAPPER.readTree("""
                {
                  "data": {
                    "symbol": "AAPL",
                    "interval": "1d",
                    "currency": "USD",
                    "candles": [
                      { "date": "2026-09-26", "open": 210.0, "high": 214.0, "low": 209.5, "close": 213.5, "adjclose": 213.5, "volume": 1000 }
                    ]
                  },
                  "meta": { "asOf": "2026-10-26T12:00:00Z", "source": "fauxnance", "partial": false }
                }
                """);
    }

    @Test
    void getHistoricalCandles_reusesCachedResponseForTheSameRequest() throws Exception {
        when(restTemplate.exchange(eq(CANDLES_URI), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(candlesBody()));

        PricingCandlesResponseDTO first = pricingService.getHistoricalCandles("aapl", LocalDate.of(2026, 9, 26), null, "1d");
        PricingCandlesResponseDTO second = pricingService.getHistoricalCandles("AAPL", LocalDate.of(2026, 9, 26), null, "1d");

        assertEquals(1, first.candles().size());
        assertEquals(first, second);
        verify(restTemplate, times(1)).exchange(eq(CANDLES_URI), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class));
    }

    @Test
    void getHistoricalCandles_doesNotCacheBackfillingResponses() {
        when(restTemplate.exchange(eq(CANDLES_URI), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.status(HttpStatus.ACCEPTED).build());

        pricingService.getHistoricalCandles("AAPL", LocalDate.of(2026, 9, 26), null, "1d");
        pricingService.getHistoricalCandles("AAPL", LocalDate.of(2026, 9, 26), null, "1d");

        verify(restTemplate, times(2)).exchange(eq(CANDLES_URI), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class));
    }

    @Test
    void getHistoricalCandles_cacheDisabledWhenTtlIsZero() throws Exception {
        PricingService uncached = new PricingService(restTemplateBuilder, instrumentRepository, "http://fauxnance.example", "test-key", 5, 0);
        when(restTemplate.exchange(eq(CANDLES_URI), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(candlesBody()));

        uncached.getHistoricalCandles("AAPL", LocalDate.of(2026, 9, 26), null, "1d");
        uncached.getHistoricalCandles("AAPL", LocalDate.of(2026, 9, 26), null, "1d");

        verify(restTemplate, times(2)).exchange(eq(CANDLES_URI), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class));
    }

    @Test
    void getRequestedQuotes_asksFauxnanceForCoinsAsDollarPairsAndAnswersWithTheShortTicker() throws Exception {
        Instrument btc = new Instrument();
        btc.setInstrumentId(100);
        btc.setTicker("BTC");
        btc.setType(InstrumentType.crypto);
        Instrument spy = new Instrument();
        spy.setInstrumentId(110);
        spy.setTicker("SPY");
        spy.setType(InstrumentType.etf);
        JsonNode body = OBJECT_MAPPER.readTree("""
                {"data": {"quotes": [
                  {"symbol": "X:BTC-USD", "quote": {"symbol": "X:BTC-USD", "price": 80143.04, "bid": 80129.9, "ask": 80156.18, "currency": "USD"}},
                  {"symbol": "SPY", "quote": {"symbol": "SPY", "price": 765.6, "bid": 765.56, "ask": 765.64, "currency": "USD"}}
                ]}}
                """);
        when(restTemplate.exchange(eq("/quotes?symbols={symbols}"), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class),
                eq("X:BTC-USD,SPY"))).thenReturn(ResponseEntity.ok(body));
        when(instrumentRepository.save(any(Instrument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<PricingQuoteDTO> result = pricingService.getRequestedQuotes(List.of("BTC", "SPY"), Map.of("BTC", btc, "SPY", spy));

        assertEquals(List.of("BTC", "SPY"), result.stream().map(PricingQuoteDTO::symbol).toList());
        assertEquals(100, result.get(0).instrumentId());
        assertEquals(80156.18, result.get(0).ask());
        assertEquals("BTC", btc.getTicker());
    }

    @Test
    void getHistoricalCandles_usesTheDollarPairForCoins() throws Exception {
        Instrument btc = new Instrument();
        btc.setTicker("BTC");
        btc.setType(InstrumentType.crypto);
        when(instrumentRepository.findByTicker("BTC")).thenReturn(Optional.of(btc));
        JsonNode body = OBJECT_MAPPER.readTree("""
                {"data": {"symbol": "X:BTC-USD", "interval": "1d", "currency": "USD",
                          "candles": [{"date": "2026-10-23", "open": 1, "high": 2, "low": 1, "close": 2, "adjclose": 2, "volume": 5}]},
                 "meta": {"asOf": "2026-10-26T12:00:00Z", "source": "fauxnance", "partial": false}}
                """);
        when(restTemplate.exchange(eq("/candles/X:BTC-USD?from=2026-10-19&interval=1d"), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(body));

        // Asking for the Fauxnance symbol directly lands on the same instrument.
        PricingCandlesResponseDTO candles = pricingService.getHistoricalCandles("x:btc-usd", LocalDate.of(2026, 10, 19), null, "1d");

        assertEquals("BTC", candles.symbol());
        assertEquals(1, candles.candles().size());
    }

    @Test
    void fauxnanceSymbolsMapBothWays() {
        Instrument eth = new Instrument();
        eth.setType(InstrumentType.crypto);
        Instrument aapl = new Instrument();
        aapl.setType(InstrumentType.equity);

        assertEquals("X:ETH-USD", PricingService.toFauxnanceSymbol("ETH", eth));
        assertEquals("AAPL", PricingService.toFauxnanceSymbol("AAPL", aapl));
        assertEquals("BRK.B", PricingService.toFauxnanceSymbol("BRK.B", null));
        assertEquals("ETH", PricingService.fromFauxnanceSymbol("X:ETH-USD"));
        assertEquals("SPY", PricingService.fromFauxnanceSymbol("SPY"));
    }
}
