package com.tidbits.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.nimbusds.jose.jwk.source.RateLimitReachedException;
import com.tidbits.exception.*;
import com.tidbits.model.dto.PricingBatchResponseDTO;
import com.tidbits.model.dto.PricingCandleDTO;
import com.tidbits.model.dto.PricingCandlesResponseDTO;
import com.tidbits.model.dto.PricingQuoteDTO;
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
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
public class PricingService {

    private static final int MAX_SYMBOLS = 25;

    private final RestTemplate restTemplate;
    private final String apiKey;

    public PricingService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${fauxnance.base-url}") String fauxnanceBaseUrl,
            @Value("${fauxnance.api-key:}") String apiKey
    ) {
        this.restTemplate = restTemplateBuilder
                .rootUri(fauxnanceBaseUrl)
                .build();
        this.apiKey = apiKey;
    }

    public PricingBatchResponseDTO getBatchQuotes(List<String> rawSymbols) {
        requireApiKey();

        List<String> symbols = normalizeSymbols(rawSymbols);
        String symbolsParam = String.join(",", symbols);

        HttpEntity<Void> requestEntity = authRequestEntity();

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

            return toPricingResponse(body);
        } catch (HttpClientErrorException.BadRequest ex) {
            throw new BadRequestException("Invalid symbol list for Fauxnance batch quotes.");
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

        return rawSymbol.trim();
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
                normalized.add(trimmed);
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
                        symbol,
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
                    quoteNode.path("symbol").asText(symbol),
                    numberOrNull(quoteNode.path("price")),
                    textOrNull(quoteNode.path("currency")),
                    textOrNull(quoteNode.path("asOf")),
                    item.path("stale").asBoolean(false),
                    textOrNull(item.path("source")),
                    null,
                    null
            ));
        }

        return new PricingBatchResponseDTO(asOf, quotes);
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
