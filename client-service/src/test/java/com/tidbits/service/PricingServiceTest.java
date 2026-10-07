package com.tidbits.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tidbits.model.dto.PricingQuoteDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.repository.InstrumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
                5
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
}
