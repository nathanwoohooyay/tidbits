package com.tidbits.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.BusinessException;
import com.tidbits.model.dto.PricingBatchResponseDTO;
import com.tidbits.model.dto.PricingQuoteDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;

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
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("Fauxnance API key is missing. Set FAUXNANCE_API_KEY in client-service/.env.");
        }

        List<String> symbols = normalizeSymbols(rawSymbols);
        String symbolsParam = String.join(",", symbols);

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

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
        } catch (HttpClientErrorException.Unauthorized | HttpClientErrorException.Forbidden ex) {
            throw new BusinessException("Fauxnance rejected the API key. Check FAUXNANCE_API_KEY.");
        } catch (HttpClientErrorException.TooManyRequests ex) {
            throw new BusinessException("Fauxnance rate limit reached. Try again later.");
        } catch (HttpServerErrorException | ResourceAccessException ex) {
            throw new BusinessException("Fauxnance is unavailable right now. Try again later.");
        } catch (RestClientException ex) {
            throw new BusinessException("Failed to call Fauxnance batch quotes endpoint.");
        }
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

    private Double numberOrNull(JsonNode node) {
        return node != null && node.isNumber() ? node.asDouble() : null;
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }

        String text = node.asText(null);
        return (text == null || text.isBlank()) ? null : text;
    }
}
