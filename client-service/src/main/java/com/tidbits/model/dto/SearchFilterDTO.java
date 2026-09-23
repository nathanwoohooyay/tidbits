package com.tidbits.model.dto;

import java.util.Map;

public class SearchFilterDTO {
    private Map<String, Object> filters;
    private Integer pageNumber;
    private Integer pageSize;

    public SearchFilterDTO() {
    }

    public SearchFilterDTO(Map<String, Object> filters, Integer pageNumber, Integer pageSize) {
        this.filters = filters;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
    }

    public Map<String, Object> getFilters() {
        return filters;
    }

    public void setFilters(Map<String, Object> filters) {
        this.filters = filters;
    }

    public Integer getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(Integer pageNumber) {
        this.pageNumber = pageNumber;
    }

    public Integer getPageSize() {
        return pageSize;
    }

    public void setPageSize(Integer pageSize) {
        this.pageSize = pageSize;
    }
}
