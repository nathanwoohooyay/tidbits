package com.tidbits.controller;

import com.tidbits.service.PortfolioSnapshotService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PortfolioSnapshotController.class)
@AutoConfigureMockMvc(addFilters = false)
class PortfolioSnapshotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PortfolioSnapshotService portfolioSnapshotService;

    @Test
    void getSnapshotsByUserId_returnsBadRequestWhenUserIdIsNotNumeric() throws Exception {
        mockMvc.perform(get("/api/portfolio-snapshots/user/{userId}", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("TYPE_MISMATCH"))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getSnapshotsByAccountId_returnsBadRequestWhenAccountIdIsNotNumeric() throws Exception {
        mockMvc.perform(get("/api/portfolio-snapshots/account/{accountId}", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("TYPE_MISMATCH"))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getSnapshotsByAccountId_returnsForbiddenWhenServiceDeniesOwnership() throws Exception {
        when(portfolioSnapshotService.getSnapshotsByAccountId(42L))
                .thenThrow(new AccessDeniedException("Authenticated user does not own account 42."));

        mockMvc.perform(get("/api/portfolio-snapshots/account/{accountId}", 42))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"))
                .andExpect(jsonPath("$.message").value("Authenticated user does not own account 42."))
                .andExpect(jsonPath("$.status").value(403));

        verify(portfolioSnapshotService).getSnapshotsByAccountId(42L);
    }

    @Test
    void getSnapshotsByUserId_returnsOkWhenUserIdIsNumeric() throws Exception {
        when(portfolioSnapshotService.getSnapshotsByUserId(7L)).thenReturn(List.of());

        mockMvc.perform(get("/api/portfolio-snapshots/user/{userId}", 7))
                .andExpect(status().isOk());

        verify(portfolioSnapshotService).getSnapshotsByUserId(7L);
    }
}
