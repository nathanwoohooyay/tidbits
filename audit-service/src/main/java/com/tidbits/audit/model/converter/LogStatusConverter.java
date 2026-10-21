package com.tidbits.audit.model.converter;

import com.tidbits.audit.model.enums.LogStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class LogStatusConverter implements AttributeConverter<LogStatus, String> {

    @Override
    public String convertToDatabaseColumn(LogStatus attribute) {
        return attribute == null ? null : attribute.toDatabaseValue();
    }

    @Override
    public LogStatus convertToEntityAttribute(String dbData) {
        return LogStatus.fromValue(dbData);
    }
}
