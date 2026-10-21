package com.tidbits.controller;

import com.tidbits.model.dto.PricingBatchResponseDTO;
import com.tidbits.model.dto.PricingCandleDTO;
import com.tidbits.model.dto.PricingCandlesResponseDTO;
import com.tidbits.model.dto.PricingQuoteDTO;
import com.tidbits.service.PricingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PricingController.class)
@AutoConfigureMockMvc(addFilters = false)
class PricingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PricingService pricingService;

    @Test
    void getQuotes_trimsSymbolsAndForwardsRefreshFlag() throws Exception {
        PricingBatchResponseDTO batch = new PricingBatchResponseDTO(
                "2026-10-07T00:00:00Z",
                List.of(new PricingQuoteDTO(1, "AAPL", 123.45, null, null, null, null, null, "USD", "asof", false, "faux", null, null))
        );
        when(pricingService.getBatchQuotes(List.of("AAPL", "MSFT"), true)).thenReturn(batch);

        mockMvc.perform(get("/api/pricing/quotes")
                        .queryParam("symbols", " AAPL , , MSFT  ")
                        .queryParam("refresh", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotes[0].symbol").value("AAPL"));

        verify(pricingService).getBatchQuotes(List.of("AAPL", "MSFT"), true);
    }

    @Test
    void getHistoricalCandles_returnsAcceptedForBackfillResponse() throws Exception {
        PricingCandlesResponseDTO response = new PricingCandlesResponseDTO(
                "AAPL", "1d", "USD", null, "faux", true, "2026-10-01", List.of()
        );
        when(pricingService.getHistoricalCandles("AAPL", null, null, "1d")).thenReturn(response);

        mockMvc.perform(get("/api/pricing/candles/{symbol}", "AAPL"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.partial").value(true));
    }

    @Test
    void getHistoricalCandles_returnsOkForCompleteResponse() throws Exception {
        PricingCandlesResponseDTO response = new PricingCandlesResponseDTO(
                "AAPL", "1d", "USD", "2026-10-07T00:00:00Z", "faux", false, "2026-10-01",
                List.of(new PricingCandleDTO("2026-10-07", 1.0, 2.0, 0.5, 1.5, 1.5, 123L, false))
        );
        when(pricingService.getHistoricalCandles("AAPL", null, null, "1d")).thenReturn(response);

        mockMvc.perform(get("/api/pricing/candles/{symbol}", "AAPL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.candles[0].close").value(1.5));
    }
}
