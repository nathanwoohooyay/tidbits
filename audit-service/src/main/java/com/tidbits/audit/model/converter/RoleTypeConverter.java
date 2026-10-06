package com.tidbits.audit.model.converter;

import com.tidbits.audit.model.enums.RoleType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class RoleTypeConverter implements AttributeConverter<RoleType, String> {

    @Override
    public String convertToDatabaseColumn(RoleType attribute) {
        return attribute == null ? null : attribute.toDatabaseValue();
    }

    @Override
    public RoleType convertToEntityAttribute(String dbData) {
        return RoleType.fromValue(dbData);
    }
}