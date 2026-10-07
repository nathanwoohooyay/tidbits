package com.tidbits.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.tidbits.exception.*;
import com.tidbits.model.dto.PricingBatchResponseDTO;
import com.tidbits.model.dto.PricingCandleDTO;
import com.tidbits.model.dto.PricingCandlesResponseDTO;
import com.tidbits.model.dto.PricingQuoteDTO;
import com.tidbits.model.entity.Instrument;
import com.tidbits.model.enums.InstrumentType;
import com.tidbits.repository.InstrumentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class PricingService {

    private static final int MAX_SYMBOLS = 25;

    private final RestTemplate restTemplate;
    private final InstrumentRepository instrumentRepository;
    private final String apiKey;
    private final long quoteCacheTtlMinutes;

    public PricingService(
            RestTemplateBuilder restTemplateBuilder,
            InstrumentRepository instrumentRepository,
            @Value("${fauxnance.base-url}") String fauxnanceBaseUrl,
            @Value("${fauxnance.api-key:}") String apiKey,
            @Value("${pricing.quote-cache-ttl-minutes:5}") long quoteCacheTtlMinutes
    ) {
        this.restTemplate = restTemplateBuilder
                .rootUri(fauxnanceBaseUrl)
                .build();
        this.instrumentRepository = instrumentRepository;
        this.apiKey = apiKey;
        this.quoteCacheTtlMinutes = quoteCacheTtlMinutes;
    }

    public PricingBatchResponseDTO getBatchQuotes(List<String> rawSymbols, boolean refresh) {

        List<String> symbols = normalizeSymbols(rawSymbols);
        List<PricingQuoteDTO> quotes = refresh
                ? getRefreshedQuotes(symbols)
                : getDbQuoteOrRequestQuote(symbols);

        String asOf = quotes.stream()
                .map(PricingQuoteDTO::asOf)
                .filter(value -> value != null && !value.isBlank())
                .max(String::compareTo)
                .orElse(null);

        return new PricingBatchResponseDTO(asOf, quotes);
    }

    private List<PricingQuoteDTO> getRefreshedQuotes(List<String> symbols) {
        return getRequestedQuotes(symbols, findExistingInstrumentsBySymbol(symbols));
    }

    private Map<String, Instrument> findExistingInstrumentsBySymbol(List<String> symbols) {
        Map<String, Instrument> existingInstrumentsBySymbol = new HashMap<>();
        List<Instrument> existingInstruments = getDbQuotes(symbols);

        for (Instrument instrument : existingInstruments) {
            existingInstrumentsBySymbol.put(instrument.getTicker().toUpperCase(Locale.ROOT), instrument);
        }

        return existingInstrumentsBySymbol;
    }

    public List<PricingQuoteDTO> getDbQuoteOrRequestQuote(List<String> symbols) {
        List<PricingQuoteDTO> dbQuotes = new ArrayList<>();
        List<String> symbolsToRequest = new ArrayList<>();
        Map<String, Instrument> existingInstrumentsBySymbol = findExistingInstrumentsBySymbol(symbols);

        for (String symbol : symbols) {

            Instrument instrument = existingInstrumentsBySymbol.get(symbol.toUpperCase(Locale.ROOT));
            
            if (instrument != null && isFresh(instrument)) {
                dbQuotes.add(toDatabaseQuoteResponse(instrument));
                continue;
            }

            symbolsToRequest.add(symbol);
            existingInstrumentsBySymbol.put(symbol.toUpperCase(Locale.ROOT), instrument);
        }

        List<PricingQuoteDTO> requestedQuotes = getRequestedQuotes(symbolsToRequest, existingInstrumentsBySymbol);

        Map<String, PricingQuoteDTO> quotesBySymbol = new HashMap<>();
        for (PricingQuoteDTO quote : dbQuotes) {
            if (quote.symbol() != null) {
                quotesBySymbol.put(quote.symbol().toUpperCase(Locale.ROOT), quote);
            }
        }
        for (PricingQuoteDTO quote : requestedQuotes) {
            if (quote.symbol() != null) {
                quotesBySymbol.put(quote.symbol().toUpperCase(Locale.ROOT), quote);
            }
        }

        List<PricingQuoteDTO> orderedQuotes = new ArrayList<>(symbols.size());
        for (String symbol : symbols) {
            PricingQuoteDTO quote = quotesBySymbol.get(symbol.toUpperCase(Locale.ROOT));
            if (quote != null) {
                orderedQuotes.add(quote);
            }
        }

        return orderedQuotes;
    }

    public List<Instrument> getDbQuotes(List<String> symbols) {
        return instrumentRepository.findByTickerIn(symbols);
    }

    public List<PricingQuoteDTO> getRequestedQuotes(List<String> symbols, Map<String, Instrument> existingInstrumentsBySymbol) {
        if (symbols.isEmpty()) {
            return List.of();
        }

        requireApiKey();

        Map<String, Instrument> mutableInstrumentsBySymbol = new HashMap<>(existingInstrumentsBySymbol);

        List<PricingQuoteDTO> requestedQuotes = requestQuotePriceFromFauxnance(symbols);
        List<PricingQuoteDTO> quotesWithInstrumentIds = new ArrayList<>(requestedQuotes.size());
        for (PricingQuoteDTO requestedQuote : requestedQuotes) {
            if (requestedQuote.symbol() == null) {
                quotesWithInstrumentIds.add(requestedQuote);
                continue;
            }

            String symbolKey = requestedQuote.symbol().toUpperCase(Locale.ROOT);
            Instrument instrument = mutableInstrumentsBySymbol.get(symbolKey);
            if (instrument == null) {
                instrument = requestSymbolInfoFromFauxnance(requestedQuote.symbol());
            }

            instrument = persistRequestedQuote(instrument, requestedQuote);
            mutableInstrumentsBySymbol.put(symbolKey, instrument);
            quotesWithInstrumentIds.add(withInstrumentId(requestedQuote, instrument.getInstrumentId()));
        }

        return quotesWithInstrumentIds;
    }

    public PricingCandlesResponseDTO getHistoricalCandles(String rawSymbol, LocalDate from, LocalDate to, String interval) {
        requireApiKey();

        String symbol = normalizeSymbol(rawSymbol);
        String normalizedInterval = normalizeInterval(interval);

        HttpEntity<Void> requestEntity = authRequestEntity();

        String uri = UriComponentsBuilder.fromPath("/candles/{symbol}")
                .queryParamIfPresent("from", nullableDate(from))
                .queryParamIfPresent("to", nullableDate(to))
                .queryParam("interval", normalizedInterval)
                .buildAndExpand(symbol)
                .toUriString();

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    requestEntity,
                    JsonNode.class
            );

            if (response.getStatusCode() == HttpStatus.ACCEPTED) {
                return acceptedCandlesResponse(symbol, normalizedInterval);
            }

            JsonNode body = response.getBody();
            if (body == null) {
                throw new BusinessException("Fauxnance returned an empty candles response.");
            }

            return toCandlesResponse(body);
        } catch (HttpClientErrorException.BadRequest ex) {
            throw new BadRequestException("Invalid candles request. Check symbol, dates, and interval.");
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResourceNotFoundException("Symbol was not recognized by Fauxnance.");
        } catch (HttpClientErrorException.Unauthorized ex) {
            throw new AuthenticationException("Fauxnance rejected the API key. Check FAUXNANCE_API_KEY.");
        } catch (HttpClientErrorException.Forbidden ex) {
            throw new AccessDeniedException("Permissions lacked to access Fauxnance route.");
        } catch (HttpClientErrorException.TooManyRequests ex) {
            throw new RateLimitExceededException("Fauxnance rate limit reached. Try again later.");
        } catch (HttpServerErrorException | ResourceAccessException ex) {
            throw new BusinessException("Fauxnance is unavailable right now. Try again later.");
        } catch (RestClientException ex) {
            throw new BusinessException("Failed to call Fauxnance historical candles endpoint.");
        }
    }

    private PricingCandlesResponseDTO acceptedCandlesResponse(String symbol, String interval) {
        return new PricingCandlesResponseDTO(
                symbol,
                interval,
                null,
                null,
                "fauxnance",
                true,
                null,
                List.of()
        );
    }

    private boolean isFresh(Instrument instrument) {
        if (instrument.getLastUpdated() == null || quoteCacheTtlMinutes <= 0) {
            return false;
        }

        return !instrument.getLastUpdated().isBefore(LocalDateTime.now().minusMinutes(quoteCacheTtlMinutes));
    }

    private PricingQuoteDTO toDatabaseQuoteResponse(Instrument instrument) {
        return new PricingQuoteDTO(
                instrument.getInstrumentId(),
                instrument.getTicker(),
                instrument.getLastPrice(),
                instrument.getChange(),
                null,
                null,
                instrument.getChangePercent(),
                instrument.getPrevClose(),
                instrument.getCurrency(),
                instrument.getLastUpdated() == null ? null : instrument.getLastUpdated().toString(),
                null,
                "database",
                null,
                null
        );
    }

    private Instrument persistRequestedQuote(Instrument instrument, PricingQuoteDTO quote) {
        if (quote.price() == null) {
            return instrument;
        }

        instrument.setTicker(quote.symbol());
        instrument.setLastPrice(quote.price());
        instrument.setCurrency(quote.currency());
        instrument.setLastUpdated(asDateTimeOrNow(quote.asOf()));
        instrument.setChange(quote.change());
        instrument.setChangePercent(quote.changePercent());
        instrument.setPrevClose(quote.prevClose());
        return instrumentRepository.save(instrument);
    }

    private PricingQuoteDTO withInstrumentId(PricingQuoteDTO quote, Integer instrumentId) {
        return new PricingQuoteDTO(
                instrumentId,
                quote.symbol(),
                quote.price(),
                quote.change(),
                quote.bid(),
                quote.ask(),
                quote.changePercent(),
                quote.prevClose(),
                quote.currency(),
                quote.asOf(),
                quote.stale(),
                quote.source(),
                quote.errorCode(),
                quote.errorMessage()
        );
    }

    private Instrument requestSymbolInfoFromFauxnance(String symbol) {
        HttpEntity<Void> requestEntity = authRequestEntity();

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    "/symbols/{symbol}",
                    HttpMethod.GET,
                    requestEntity,
                    JsonNode.class,
                    symbol
            );

            JsonNode body = response.getBody();
            if (body == null) {
                throw new BusinessException("Fauxnance returned an empty symbol response.");
            }

            JsonNode dataNode = body.path("data");
            if (!dataNode.isObject() || dataNode.isMissingNode()) {
                throw new BusinessException("Fauxnance symbol response format was not recognized.");
            }

            String resolvedSymbol = textOrNull(dataNode.path("symbol"));
            String name = textOrNull(dataNode.path("name"));
            String exchange = textOrNull(dataNode.path("exchange"));
            String currency = textOrNull(dataNode.path("currency"));

            Instrument instrument = new Instrument();
            instrument.setTicker(resolvedSymbol == null ? symbol : resolvedSymbol);
            instrument.setName(name == null ? instrument.getTicker() : name);
            instrument.setType(toInstrumentType(dataNode.path("type")));
            instrument.setExchange(exchange == null ? "UNKNOWN" : exchange);
            instrument.setCurrency(currency);
            return instrument;
        } catch (HttpClientErrorException.BadRequest ex) {
            throw new BadRequestException("Invalid symbol for Fauxnance symbol request.");
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResourceNotFoundException("Symbol was not recognized by Fauxnance.");
        } catch (HttpClientErrorException.Unauthorized ex) {
            throw new AuthenticationException("Fauxnance rejected the API key. Check FAUXNANCE_API_KEY.");
        } catch (HttpClientErrorException.Forbidden ex) {
            throw new AccessDeniedException("Permissions lacked to access Fauxnance route.");
        } catch (HttpClientErrorException.TooManyRequests ex) {
            throw new RateLimitExceededException("Fauxnance rate limit reached. Try again later.");
        } catch (HttpServerErrorException | ResourceAccessException ex) {
            throw new BusinessException("Fauxnance is unavailable right now. Try again later.");
        } catch (RestClientException ex) {
            throw new BusinessException("Failed to call Fauxnance symbol endpoint.");
        }
    }

    private InstrumentType toInstrumentType(JsonNode node) {
        String type = textOrNull(node);
        if (type == null) {
            return InstrumentType.equity;
        }

        try {
            return InstrumentType.valueOf(type.toLowerCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return InstrumentType.equity;
        }
    }

    private List<PricingQuoteDTO> requestQuotePriceFromFauxnance(List<String> symbols) {
        HttpEntity<Void> requestEntity = authRequestEntity();
        String symbolsParam = String.join(",", symbols);

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    "/quotes?symbols={symbols}",
                    HttpMethod.GET,
                    requestEntity,
                    JsonNode.class,
                    symbolsParam
            );

            JsonNode body = response.getBody();
            if (body == null) {
                throw new BusinessException("Fauxnance returned an empty response.");
            }

            List<PricingQuoteDTO> quotes = toPricingQuotes(body);
            if (quotes.isEmpty()) {
                throw new BusinessException("Fauxnance returned no quote rows.");
            }

            return quotes;
        } catch (HttpClientErrorException.BadRequest ex) {
            throw new BadRequestException("Invalid symbol(s) for Fauxnance quote request.");
        } catch (HttpClientErrorException.Unauthorized ex) {
            throw new AuthenticationException("Fauxnance rejected the API key. Check FAUXNANCE_API_KEY.");
        } catch (HttpClientErrorException.Forbidden ex) {
            throw new AccessDeniedException("Permissions lacked to access Fauxnance route.");
        } catch (HttpClientErrorException.TooManyRequests ex) {
            throw new RateLimitExceededException("Fauxnance rate limit reached. Try again later.");
        } catch (HttpServerErrorException | ResourceAccessException ex) {
            throw new BusinessException("Fauxnance is unavailable right now. Try again later.");
        } catch (RestClientException ex) {
            throw new BusinessException("Failed to call Fauxnance batch quotes endpoint.");
        }
    }

    private LocalDateTime asDateTimeOrNow(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now();
        }

        try {
            return LocalDateTime.parse(value);
        } catch (RuntimeException ex) {
            return LocalDateTime.now();
        }
    }

    private void requireApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("Fauxnance API key is missing. Set FAUXNANCE_API_KEY in the repository root .env.");
        }
    }

    private HttpEntity<Void> authRequestEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);
        return new HttpEntity<>(headers);
    }

    private String normalizeSymbol(String rawSymbol) {
        if (rawSymbol == null || rawSymbol.isBlank()) {
            throw new BadRequestException("Symbol is required.");
        }

        return rawSymbol.trim().toUpperCase();
    }

    private String normalizeInterval(String rawInterval) {
        String normalized = rawInterval == null ? "1d" : rawInterval.trim();
        if (!"1d".equalsIgnoreCase(normalized)) {
            throw new BadRequestException("Only interval=1d is supported right now.");
        }

        return "1d";
    }

    private java.util.Optional<LocalDate> nullableDate(LocalDate value) {
        if (value == null) {
            return java.util.Optional.empty();
        }

        return java.util.Optional.of(value);
    }

    private List<String> normalizeSymbols(List<String> rawSymbols) {
        if (rawSymbols == null || rawSymbols.isEmpty()) {
            throw new BadRequestException("At least one symbol is required.");
        }

        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String symbol : rawSymbols) {
            if (symbol == null) {
                continue;
            }

            String trimmed = symbol.trim();
            if (!trimmed.isEmpty()) {
                normalized.add(trimmed.toUpperCase());
            }
        }

        if (normalized.isEmpty()) {
            throw new BadRequestException("At least one non-blank symbol is required.");
        }

        if (normalized.size() > MAX_SYMBOLS) {
            throw new BadRequestException("A maximum of 25 symbols can be requested at once.");
        }

        return normalized.stream().toList();
    }

    private PricingBatchResponseDTO toPricingResponse(JsonNode body) {
        String asOf = body.path("meta").path("asOf").asText(null);
        List<PricingQuoteDTO> quotes = toPricingQuotes(body);

        return new PricingBatchResponseDTO(asOf, quotes);
    }

    private List<PricingQuoteDTO> toPricingQuotes(JsonNode body) {
        JsonNode quotesNode = body.path("data").path("quotes");

        if (!quotesNode.isArray()) {
            throw new BusinessException("Fauxnance response format was not recognized.");
        }

        List<PricingQuoteDTO> quotes = new ArrayList<>();
        for (JsonNode item : quotesNode) {
            String symbol = item.path("symbol").asText(null);

            if (item.hasNonNull("error")) {
                JsonNode errorNode = item.path("error");
                quotes.add(new PricingQuoteDTO(
                        null,
                        symbol,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        false,
                        null,
                        errorNode.path("code").asText(null),
                        errorNode.path("message").asText(null)
                ));
                continue;
            }

            JsonNode quoteNode = item.path("quote");
            quotes.add(new PricingQuoteDTO(
                    null,
                    quoteNode.path("symbol").asText(symbol),
                    numberOrNull(quoteNode.path("price")),
                    numberOrNull(quoteNode.path("change")),
                    numberOrNull(quoteNode.path("bid")),
                    numberOrNull(quoteNode.path("ask")),
                    numberOrNull(quoteNode.path("changePercent")),
                    numberOrNull(quoteNode.path("previousClose")),
                    textOrNull(quoteNode.path("currency")),
                    textOrNull(quoteNode.path("asOf")),
                    item.path("stale").asBoolean(false),
                    textOrNull(item.path("source")),
                    null,
                    null
            ));
        }

        return quotes;
    }

    private PricingCandlesResponseDTO toCandlesResponse(JsonNode body) {
        JsonNode dataNode = body.path("data");
        JsonNode metaNode = body.path("meta");
        JsonNode candlesNode = dataNode.path("candles");

        if (!candlesNode.isArray()) {
            throw new BusinessException("Fauxnance candles response format was not recognized.");
        }

        List<PricingCandleDTO> candles = new ArrayList<>();
        for (JsonNode candleNode : candlesNode) {
            candles.add(new PricingCandleDTO(
                    textOrNull(candleNode.path("date")),
                    numberOrNull(candleNode.path("open")),
                    numberOrNull(candleNode.path("high")),
                    numberOrNull(candleNode.path("low")),
                    numberOrNull(candleNode.path("close")),
                    numberOrNull(candleNode.path("adjclose")),
                    longOrNull(candleNode.path("volume")),
                    candleNode.path("synthetic").asBoolean(false)
            ));
        }

        return new PricingCandlesResponseDTO(
                textOrNull(dataNode.path("symbol")),
                textOrNull(dataNode.path("interval")),
                textOrNull(dataNode.path("currency")),
                textOrNull(metaNode.path("asOf")),
                textOrNull(metaNode.path("source")),
                metaNode.path("partial").isMissingNode() ? null : metaNode.path("partial").asBoolean(),
                textOrNull(metaNode.path("availableFrom")),
                candles
        );
    }

    private Double numberOrNull(JsonNode node) {
        return node != null && node.isNumber() ? node.asDouble() : null;
    }

    private Long longOrNull(JsonNode node) {
        return node != null && node.isIntegralNumber() ? node.asLong() : null;
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }

        String text = node.asText(null);
        return (text == null || text.isBlank()) ? null : text;
    }
}
